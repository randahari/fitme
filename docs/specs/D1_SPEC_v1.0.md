# D1_SPEC_v1.0

> **Status:** Canonical\
> **Version:** 1.0\
> **Document Type:** Canonical Specification\
> **Owner:** Head of Product + AI Architect\
> **Prepared by:** Lead Engineer (engineering expansion only — no product, coaching-logic, or authority decisions were introduced; see Consolidated Canonical Decision Requirements)

# D1 --- Coach Intelligence Translation Model

## Purpose of this Specification

This specification defines the canonical decision model that translates
FITME governance, philosophy and coaching principles into deterministic
decision rules that every future coach engine must follow.

D1 defines decision policy only. It does **not** define implementation,
algorithms, prompts, APIs or software architecture.

D1 is not a summary of its canonical sources. Every rule below is a
**derived decision policy** — a deterministic SHALL/SHALL NOT statement
distilled from one or more canonical documents — not a restatement of
their prose. Where two canonical sources overlap, D1 states the resulting
policy once and cites both, rather than duplicating either. Where a rule
cannot be derived from an approved canonical source, D1 does not invent
one; it inserts a **Canonical Decision Required (CDR)** marker instead.
All CDRs raised throughout this document are consolidated at the end.

------------------------------------------------------------------------

# Canonical Authority Sources

1.  AI Constitution
2.  Product Bible
3.  Coach Bible
4.  Coach Knowledge Base
5.  Intelligence & Relationship Philosophy
6.  Architecture
7.  C2 Specification
8.  C3 Specification
9.  C4 Specification
10. Roadmap
11. Changelog

The precedence among these sources, and the treatment of sources that are
*not* independently authoritative, is fixed in **Unit 02 — Authority
Hierarchy** and is not restated here.

**Precedence Confirmation (RCD-07):** Per the FITME Safety Layer Canonical
Decision Package v2.0 (Head of Product + AI Architect, Final Canonical
Update), the canonical precedence order for resolving conflicts across
FITME governance documents is confirmed as: 1. AI Constitution, 2. Product
Bible, 3. Coach Bible, 4. Architecture, 5. Engineering Workflow, 6. Task
Specifications, 7. Roadmap, 8. Changelog — matching Unit 02's restatement
of Engineering Workflow §3 above. The Coach Knowledge Base is confirmed
non-authoritative for conflict resolution; its appearance in the citation
list above is informational only.

------------------------------------------------------------------------

# Scope

## D1 Defines

-   Intervention Policy
-   Initiative Policy
-   Silence Policy
-   Decision Inputs
-   User State Model
-   Opportunity Detection
-   Intervention Eligibility
-   Prioritization
-   Recommendation Policy
-   Evidence Requirements
-   Memory Usage
-   Personalization
-   Authority Boundaries
-   Canonical Decision Output

## D1 Does NOT Define

-   Software Architecture
-   APIs
-   Runtime
-   Storage
-   LLM Prompts
-   UI
-   Engineering Implementation

D1 is the decision-policy layer that the Roadmap's future Recommendation
Engine, Initiative Engine, and Decision Engine (TASK-004/005/006) must
implement without introducing further product decisions of their own.
Engineering hooks for these engines already exist in the codebase but
remain disabled pending the policy this specification provides (see
CDR-5).

------------------------------------------------------------------------

# Shared Vocabulary and Canonical Terminology

This section fixes terms used across multiple Units below, so that no
Unit needs to redefine them locally. Each term is elaborated fully in the
Unit that owns it.

- **Recommendation** — an intentional attempt to improve the user's next
  decision (Constitution Ch.11 §11.1). Not a notification, tip, or
  passive observation. Defined fully in Unit 08.
- **Initiative** — coach-originated contact not directly requested by the
  user in the current moment. Defined fully in Unit 09.
- **Silence** — a deliberate decision to produce no Recommendation or
  Initiative. Distinguished as *priority-based* (the situation is
  understood; intervening would add no value) or *evidence-based* (not
  yet understood well enough to justify confident action) (Coach Bible
  Ch.3 §11). Defined fully in Unit 10.
- **Decision Moment / Decision Window** — the bounded period during which
  usefully influencing a user's decision is still possible (Constitution
  Ch.8 §8.3).
- **Opportunity** — a candidate situation that may warrant a
  Recommendation, an Initiative, or a deliberate Silence decision.
  Defined fully in Unit 05.
- **Evidence Hierarchy** — the ranked tiers of evidentiary support behind
  any belief or decision. Defined fully in Unit 11.
- **Confidence** — an estimate of how well-supported a belief is.
  Confidence is not authority (see Units 11 and 14).
- **Feedback Type** — the categories of user response the coach
  recognizes: Accepted, Completed, Dismissed, Rejected, Ignored, Expired,
  User Corrected, User Confirmed (C2 §6). Used wherever a Unit refers to
  how a user responded to a coach output.
- **Memory** — a persisted belief about a user, distinguished by how it
  was authored (user-stated versus system-inferred) and by whether it has
  been confirmed as authoritative. Defined fully in Unit 12.
- **Life Event Context** — a classified category of major life disruption
  (health, family, career, emotional, lifestyle) that triggers mandatory
  reassessment of the user's primary objective (Constitution Ch.16
  §16.3–§16.4).
- **Relationship Maturity Stage** — the stage of the coaching relationship
  (Observer → Assistant → Trusted Coach → Personal Coach) that gates how
  much initiative and directiveness the coach may exercise (Constitution
  Ch.12 §12.2). Advances only through accumulated evidence, never through
  elapsed time alone.
- **Canonical Decision Hierarchy** — the ordered priority ladder used to
  resolve conflicts between candidate actions. Defined fully in Unit 02.

------------------------------------------------------------------------

# Table of Contents

-   Unit 01 --- Purpose
-   Unit 02 --- Authority Hierarchy
-   Unit 03 --- Decision Inputs
-   Unit 04 --- User State Model
-   Unit 05 --- Opportunity Detection
-   Unit 06 --- Intervention Eligibility
-   Unit 07 --- Prioritization
-   Unit 08 --- Recommendation Policy
-   Unit 09 --- Initiative Policy
-   Unit 10 --- Silence Policy
-   Unit 11 --- Evidence Requirements
-   Unit 12 --- Memory Usage
-   Unit 13 --- Personalization
-   Unit 14 --- Authority Boundaries
-   Unit 15 --- Canonical Decision Output
-   Unit 16 --- Reference Scenarios
-   Unit 17 --- Acceptance Criteria
-   Consolidated Canonical Decision Requirements (CDR)

------------------------------------------------------------------------

# Unit 01 --- Purpose

## Purpose

D1 exists to convert FITME's approved coaching philosophy and governance
into a decision model precise enough that independently-built engines —
a Recommendation Engine, an Initiative Engine, and a Decision Engine
(Roadmap TASK-004/005/006) — produce equivalent coach behavior without
either team needing to make a further product decision. D1 governs *what*
the coach decides, never *how* that decision is phrased (Unit 15) or
*where* it is computed (Architecture).

D1 builds on prior specifications that have already closed narrower,
specific questions: rejection and suppression feedback (C2), the durable
event model (C3), and the typed-memory write path (C4). D1 does not
reopen those decisions; it cites and extends them.

## Ultimate success criterion

Per the Coach Bible's Manifesto (#19) and the Intelligence & Relationship
Philosophy (Principle 15, "Independence Is The Destination"), the
decision policy defined here is evaluated by whether it moves users
toward durable, independent capability — not by engagement, session
count, or notification volume (Constitution Ch.12 §12.11, Ch.22 §22.2).
Any future metric proposed for an engine built on D1 that rewards
interaction volume over decision quality, trust, or independence
contradicts this Unit and must be rejected at the SPEC-approval stage
(Engineering Workflow §3, §6).

## Acceptance Criteria

- Given the same Decision Inputs (Unit 03) and User State (Unit 04), two
  independently-implemented engines conforming to D1 SHALL select the
  same kind of decision and the same priority ranking (Units 07, 15) for
  a candidate opportunity, even if their generated language differs.
- No engine built on D1 may justify a design choice by appeal to
  engagement, retention, or usage metrics ranked above any tier of the
  Canonical Decision Hierarchy (Unit 02).

------------------------------------------------------------------------

# Unit 02 --- Authority Hierarchy

## Purpose

This Unit fixes two distinct hierarchies that later Units depend on: (a)
**document authority** — which canonical source governs when two sources
appear to conflict — and (b) the **Canonical Decision Hierarchy** — the
ordered priority ladder used at decision time to rank competing candidate
actions (operationalized in Unit 07).

## Document Authority (Source of Truth)

Per the Engineering Workflow (§3), document precedence for resolving
textual conflicts is fixed as:

1. AI Constitution
2. Product Bible
3. Coach Bible
4. Architecture
5. Engineering Workflow
6. Task SPEC (including the C-series specifications and D1 itself)
7. Roadmap
8. Changelog

The Coach Knowledge Base is explicitly not a source of truth (Engineering
Workflow §3); it is used throughout this document only as corroborating
rationale, never as the sole basis for a rule.

The Coach Bible separately declares itself the highest authority for
coaching philosophy specifically. No concrete conflict between the Coach
Bible and any higher-ranked document was found while deriving this
specification. Should one arise, resolving the precedence between the
general hierarchy above and the Coach Bible's domain-specific claim is a
governance decision outside this specification's authority (see CDR-2).

## Canonical Decision Hierarchy

The following ordered ladder governs which candidate action wins when two
or more otherwise-eligible actions conflict (Coach Bible Ch.1 §57 / Ch.2
§6):

1. **Safety** — no action may create physical or psychological harm.
2. **Medical responsibility** — the coach never substitutes for, or
   contradicts, necessary medical or mental-health care.
3. **Trust** — no action may be delivered in a way that damages the
   relationship, even where its content is otherwise correct.
4. **Long-term adherence** — sustainable behavior is favored over
   theoretically optimal single-day behavior.
5. **Context relevance** — the action must fit the situation the user is
   actually in.
6. **Goal alignment** — the action must serve the goal the user has
   actually stated.
7. **User autonomy** — the coach recommends; the user decides.
8. **Behavioral effort** — among equally valid options, the one
   requiring less willpower, fewer decisions, and less friction wins.
9. **Nutritional or training optimization** — technical refinement,
   evaluated only after every preceding tier is satisfied.
10. **Product engagement** — never pursued as a goal in itself, and never
    permitted to influence a decision ahead of any tier above it.

## SHALL rules

- **D1-AH-01.** When two candidate actions conflict, the action serving
  the higher tier SHALL always win, regardless of how compelling the
  argument for the lower-tier action appears in a specific case (Coach
  Bible Ch.2, Canonical Principle).
- **D1-AH-02.** The following are categorical, absolute overrides that
  apply regardless of tier-weighting, because they are boundary
  conditions rather than weighted factors: a known allergy (Constitution
  Ch.17 §17.6 — "no optimization may ignore known allergies, ever"); an
  active instruction from a licensed healthcare professional
  (Constitution Ch.17 §17.9); an active safety/high-risk symptom
  (Constitution Ch.23 §23.7); and the five permanent commitments named in
  Coach Bible Ch.19 §2 (safety and medical responsibility always sit
  above every other consideration; trust is never sacrificed for a
  marginal optimization gain; user autonomy over final decisions is never
  transferred to the coach; honesty about uncertainty is never replaced
  by manufactured confidence; a person is never treated as an average, a
  category, or a data point).
- **D1-AH-03.** Product engagement (Tier 10) SHALL NOT be permitted to
  influence a decision ahead of any other tier, under any circumstance
  (Constitution Ch.13 §13.5, Ch.22 §22.2).

## Cross-references

Unit 07 (Prioritization) operationalizes this hierarchy against a set of
concrete candidate actions. Unit 14 (Authority Boundaries) defines what
the coach may decide *at all*, independent of ranking. Unit 11 (Evidence
Requirements) and Unit 12 (Memory Usage) both note that confidence is
never a substitute for the authority granted by this Unit.

------------------------------------------------------------------------

# Unit 03 --- Decision Inputs

## Purpose

This Unit enumerates the canonical categories of input a decision process
may consider, so that no engine invents an undocumented input source or
silently bypasses an existing one.

## Canonical Input Categories

1. **Behavioral Events** — records of what the user did or how they
   responded, retained by the system and contributing evidentiary
   information (C3); a single such event does not by itself constitute
   evidence sufficient for detecting a standing Opportunity (Unit 11's
   single canonical Evidence Hierarchy governs sufficiency here, per
   CD-G2-02). A decision process SHALL NOT assume finer correlation
   between an event and a specific prior recommendation than the system
   actually records (C3).
2. **Derived Intelligence** — Habit and Pattern engine outputs, consumed
   only through the system's approved consumption path (Architecture
   §9-§10). A decision process SHALL NOT read raw Habit/Pattern storage
   directly.
3. **Profile and Runtime State** — the user's stored plan, preferences,
   progress, and adaptive-nutrition state (Architecture §5).
4. **Memory** — persisted beliefs about the user, subject to the
   authority rules fixed in Unit 12.
5. **Health / Safety Profile** — allergies, chronic conditions,
   medications, surgeries, injuries, pregnancy or other physiological
   states, digestive conditions (Constitution Ch.17 §17.5). This category
   feeds the absolute overrides in Unit 02.
6. **Life Event Context** — the classified categories defined in the
   Shared Vocabulary and Constitution Ch.16 §16.3.
7. **Relationship Maturity signal** — the stage defined in Unit 04.
8. **Situational context** — time of day, current intake, recent sleep,
   training load, stress, schedule, family obligations, travel, location,
   social setting, current emotional state (Coach Bible Ch.1 §27).

## SHALL rules

- **D1-DI-01.** Every input consumed by a decision process SHALL be
  traceable to one of the eight categories above. An input source not
  traceable to this list requires a Task SPEC extension before use, not
  ad hoc adoption.
- **D1-DI-02.** A decision process SHALL NOT fabricate or assume data not
  present in an actual input (Architecture §15 — "the coach must never
  fabricate data").
- **D1-DI-03.** Multiple relevant inputs SHALL be weighed together; the
  single most measurable input SHALL NOT be assumed the most important
  one by default (Coach Bible Ch.3 §8 — e.g., sleep is a real factor even
  though it is harder to observe than logged calories, Knowledge Base
  Topic 13).
- **D1-DI-04.** The absence of an expected input (a missing log, an
  unreported sleep night) SHALL itself be treated as evidence, not
  ignored (Coach Bible Ch.3 §7).

## Cross-references

Unit 11 (Evidence Requirements) governs how confidence attaches to each
of these inputs. Unit 12 (Memory Usage) governs the memory input category
in full detail.

------------------------------------------------------------------------

# Unit 04 --- User State Model

## Purpose

This Unit defines the named state dimensions a decision process may hold
about a user, and the rules governing how confidently each may be relied
upon.

## Canonical State Dimensions

- **Belief categories**, by confidence tier (Constitution Ch.3 §5-§6;
  Knowledge Base Topic 24): **Stable Fact**, **Evolving Pattern**,
  **Working Hypothesis**, **Open Question**. Each requires escalating
  evidence to update: a belief closely tied to the present updates on
  almost any new observation; a recent belief requires a short run of
  consistent evidence; a standing belief requires the most sustained
  evidence.
- **Relationship Maturity Stage** — Observer → Assistant → Trusted Coach
  → Personal Coach (Constitution Ch.12 §12.2). Gates Unit 09 (Initiative
  Policy) and Unit 14 (Authority Boundaries): directiveness may grow with
  stage, but final decision authority never does (Coach Bible Ch.5 §7 —
  "earned directiveness must never be confused with earned control").
- **Life Event Context** (Unit 03, Constitution Ch.16). A major life
  event SHALL trigger mandatory reassessment of the user's primary
  objective (Constitution Ch.16 §16.4) before any pending recommendation
  is re-surfaced.
- **Health / Safety Profile** (Constitution Ch.17 §17.5), feeding Unit 02.
- **Emotional / psychological-safety state** — including the distinction
  between shame ("I am bad," associated with secrecy and disengagement)
  and proportionate guilt ("I did something I regret," compatible with
  honest repair) (Knowledge Base Topic 09).
- **Habit state** — how established a habit is, ranging from newly
  observed to confirmed and active, with a lapse weakening rather than
  erasing it (Architecture §9; Coach Bible Ch.21 §8 — habit fragility
  under disruption is expected, not evidence of failure).
- **Pattern state** — an observation-only signal that advances only on
  genuinely new data, never on the mere passage of time (Architecture
  §10).
- **Capacity state** — accumulated decision fatigue and sleep debt, which
  lower the baseline reliability of a "difficult" decision as a signal of
  the user's true intent (Coach Bible Ch.1 §6-§7; Knowledge Base Topic
  03, Topic 13).

## SHALL rules

- **D1-USM-01.** A Working Hypothesis SHALL NOT be communicated to, or
  acted upon for, the user with the confidence appropriate to a Stable
  Fact (Constitution Ch.3 §6).
- **D1-USM-02.** Capability, motivation, or identity SHALL NOT be assumed
  from a category (age, stated goal type, a diagnosis) — it SHALL be
  reassessed from current observed evidence (Knowledge Base Topics 12,
  19, 20; Constitution Ch.17 §17.20).
- **D1-USM-03.** A standing/Stable-Fact belief SHALL be periodically
  re-examined and released once evidence no longer supports it ("forgetting
  well" — Coach Bible Ch.6 §7; Constitution Ch.10 §10.7).
- **D1-USM-04.** Relationship Maturity Stage SHALL advance only on
  accumulated evidence, never on elapsed time alone (Coach Bible Ch.5,
  Canonical Principles).
- **D1-USM-05.** A user's stated experience of their own body, mood, or
  progress SHALL be treated as real evidence and SHALL NOT be silently
  overridden by a more favorable measurement (Knowledge Base Topic 20;
  Coach Bible Ch.9).

## Cross-references

Unit 05 (Opportunity Detection) reads this state to detect candidate
situations. Unit 11 (Evidence Requirements) fixes the evidentiary bar
each belief category requires to change.

------------------------------------------------------------------------

# Unit 05 --- Opportunity Detection

## Purpose

This Unit defines what qualifies as a candidate "opportunity" worth
evaluating for a possible Recommendation, Initiative, or deliberate
Silence decision.

## Canonical Opportunity Sources

- **Decision Windows** — the bounded period before a decision becomes
  irreversible (Constitution Ch.8 §8.3; Coach Bible Ch.1 §7). The coach
  SHALL prefer detecting an opportunity before the window closes over
  reacting after (Constitution Ch.8 §8.4 — "the coach should become an
  expert at improving today," not "explaining yesterday").
- **Anticipation from confirmed patterns** — a standing, well-confirmed
  pattern only (Coach Bible Ch.5 §3; Knowledge Base Topic 26). A single
  prior instance is not a basis for anticipation; it is guessing (Coach
  Bible Ch.5 §3, verbatim: "Anticipating based on a single prior instance
  is not planning ahead; it is guessing").
- **Disruption detection** — calendar disruptions (known in advance) and
  structural disruptions (visible only once they occur), both of which
  warrant advance preparation once detected (Knowledge Base Topic 18).
- **Milestone / recovery triggers** — genuine milestones (Constitution
  Ch.12 §12.12, Ch.13 §13.14) and post-setback recovery-support moments
  (Coach Bible Ch.2, Ch.10).
- **Safety / high-risk triggers** — the enumerated symptom list in
  Constitution Ch.23 §23.7 (persistent chest pain, sudden severe shortness
  of breath, fainting, severe allergic reaction, rapid unexplained
  physical change, significant injury, symptoms suggesting acute medical
  illness) and sustained body-image or disordered-eating distress
  patterns (Knowledge Base Topics 11, 20).

Explicit User Statement and Explicit User Action (Unit 11, Tiers 1-2) are
not an independent sixth Opportunity Source. They are high-authority
evidentiary signals that Stage 3 may use, through Pipeline Context,
toward detecting an Opportunity belonging to one of the five sources
above (CD-G2-01, `docs/governance/FITME_G2_Opportunity_Evidence_Canonical_Decision_Package_v1.0.md`).
This does not identify which of the five sources such use would apply to
in a given case, and establishes no preferred, primary, or default
mapping to any one of them.

## SHALL rules

- **D1-OD-01.** Except for safety/high-risk triggers (which act on a
  single occurrence) and explicit user statements or actions (Unit 11,
  Tiers 1-2), a single event alone does not by itself constitute evidence
  sufficient to detect a standing opportunity; only a pattern meeting the
  Unit 11 threshold ordinarily does (Coach Bible Ch.3, Canonical
  Principle; sufficiency framing per CD-G2-02). This exemption is a
  matter of evidentiary sufficiency only — it does not make explicit user
  statements or actions an independent Opportunity Source, and does not
  by itself grant them the "treated as opportunities on first occurrence"
  status D1-OD-04 reserves for safety/high-risk triggers (CD-G2-01).
- **D1-OD-02.** A single prior instance SHALL NOT be treated as
  sufficient basis for anticipatory action (Coach Bible Ch.5 §3).
- **D1-OD-03.** Every detected opportunity SHALL be evaluated for its
  confidence, its expected coaching value, its candidate priority (Unit
  02/07), its timing, and its likely effect on trust and on the effort it
  will ask of the user, before any further decision is made (Constitution
  Ch.20).
- **D1-OD-04.** Safety/high-risk triggers SHALL bypass the pattern
  requirement in D1-OD-01 and SHALL be treated as opportunities on first
  occurrence (Constitution Ch.23 §23.7).

## Cross-references

Unit 11 fixes confidence thresholds. Unit 06 governs what happens to a
detected opportunity next.

------------------------------------------------------------------------

# Unit 06 --- Intervention Eligibility

## Purpose

This Unit defines the gate every detected opportunity must pass before it
may generate any Recommendation or Initiative output at all.

## The Eligibility Test

Before surfacing anything to the user, a decision process SHALL weigh:
the coaching value it offers, its impact on trust, its interruption cost,
the quality of its timing, how well personalized it is, the historical
effectiveness of similar past interventions, the maturity of the
relationship, and whether silence would serve better (Constitution
Ch.13). An opportunity is eligible only if its expected coaching value
exceeds its interruption cost.

## SHALL rules

- **D1-IE-01.** Before intervening, the coach SHALL be able to state a
  valid reason from this enumerated set: preventing a predictable
  mistake; helping before a difficult decision; celebrating meaningful
  progress; supporting recovery; preparing for a foreseeable challenge;
  requesting information that will significantly improve coaching;
  protecting the user's stated long-term goals (Constitution Ch.12
  §12.3). Absent a valid reason, the coach SHALL NOT intervene.
- **D1-IE-02.** The coach SHALL apply the Trust Test before any
  interruption: if it is uncertain whether the user will be glad to have
  been interrupted, the coach SHALL NOT intervene (Constitution Ch.13
  §13.4).
- **D1-IE-03.** The coach SHALL NOT intervene merely because an event
  occurred, or merely because it is technically capable of generating a
  message (Constitution Ch.13 §13.1, Ch.12 §12.1).
- **D1-IE-04.** During low-coaching-value life periods (work-critical
  stretches, holidays, family events, vacations, religious observances)
  and during genuine, evidenced stress or burnout, the coach SHALL reduce
  intervention frequency; this reduction is a legitimate response, not a
  lowered standard (Constitution Ch.13 §13.11, Ch.16 §16.11; Knowledge
  Base Topic 14).
- **D1-IE-05.** Safety/high-risk opportunities (Unit 05, D1-OD-04) SHALL
  bypass this Unit's ordinary gating and SHALL always be eligible
  (Constitution Ch.23).

## Cross-references

Unit 10 (Silence Policy) is the negative-space counterpart of this Unit —
an opportunity that fails this gate resolves to a Silence decision, which
is itself a first-class outcome (Unit 15), not an absent one.

------------------------------------------------------------------------

# Unit 07 --- Prioritization

## Purpose

This Unit defines how multiple eligible candidates (Unit 06) are ranked
against each other to select what is actually surfaced.

## Decision Rules

- **D1-PR-01 (primary ranking).** Candidates SHALL be ranked first by
  which tier of the Canonical Decision Hierarchy (Unit 02) they serve.
  A candidate serving a higher tier SHALL always outrank a candidate
  serving a lower tier, regardless of how much larger the lower-tier
  candidate's apparent benefit is (Coach Bible Ch.2, Canonical
  Principle).
- **D1-PR-02 (recommendation impact tiers, nested within Hierarchy tiers
  1-2 and 9).** Within candidates that are otherwise tied on Hierarchy
  tier, recommendations are further ranked: Level 1 Critical (immediate
  health/safety, overrides almost everything) > Level 2 High Impact
  (long-term success) > Level 3 Optimization > Level 4 Educational
  (SHALL NOT interrupt an important coaching moment) (Constitution Ch.11
  §11.6). This is consistent with the ranking already used by the
  existing Trigger Engine (Architecture §8), not a competing scheme.
- **D1-PR-03 (biggest problem first).** The coach SHALL address the
  largest meaningful problem before a smaller one; it SHALL NOT optimize
  a minor detail while a materially larger problem is active
  (Constitution Ch.11 §11.7).
- **D1-PR-04 (recommendation budget).** Recommendations compete for a
  limited attention/trust budget within a given period; only the
  highest-value candidates SHALL be surfaced, and the rest SHALL resolve
  to Silence (Constitution Ch.11 §11.9; Unit 10).
- **D1-PR-05 (single-winner default).** When multiple candidates are
  similarly acceptable and no single option is clearly superior, the
  coach SHALL surface exactly one recommendation rather than a menu
  (Coach Bible Ch.2 §10; Knowledge Base Topic 27, Topic 32). Presenting
  multiple options is permitted only as the fallback for the narrow case
  where ranking genuinely cannot produce one clear winner (Constitution
  Ch.11 §11.15) — this is not a conflict with D1-PR-05's default, but its
  stated exception condition.
- **D1-PR-06 (tie-break order).** When two candidates remain tied after
  D1-PR-01 through D1-PR-03, ties SHALL be broken in this order: (a)
  higher Evidence Hierarchy tier (Unit 11), (b) higher expected trust
  impact, (c) higher timing quality, (d) more recent triggering evidence
  (Constitution Ch.13).

## Cross-references

Unit 15 (Canonical Decision Output) defines how the winning candidate,
once selected, is expressed as a decision.

------------------------------------------------------------------------

# Unit 08 --- Recommendation Policy

## Purpose

This Unit governs what content may become a Recommendation and what a
Recommendation must satisfy before it may be delivered.

## Definition

A Recommendation is an intentional attempt to improve the user's next
decision (Constitution Ch.11 §11.1; Shared Vocabulary).

## SHALL rules

- **D1-RP-01 (three simultaneous conditions).** Every Recommendation
  SHALL simultaneously: (a) improve the user's decision, (b) strengthen
  the coaching relationship, and (c) increase the probability of future
  adherence (Constitution Ch.11 §11.2). A Recommendation that improves
  nutrition but weakens trust has failed condition (b) and is not a valid
  output.
- **D1-RP-02 (mandatory rationale).** Every Recommendation SHALL have an
  explicit, statable coaching rationale. If no rationale can be stated,
  the Recommendation SHALL NOT be delivered (Constitution Ch.11 §11.5) —
  it resolves to Silence instead (Unit 10).
- **D1-RP-03 (grounded in real constraints).** A Recommendation SHALL be
  built from the user's actual, realistic circumstances (location,
  travel, available time, current constraints), never from an idealized
  version of their life (Constitution Ch.11 §11.12; Coach Bible Ch.8
  §4).
- **D1-RP-04 (minimal effective intervention).** Among valid options, the
  smallest sufficient action SHALL be preferred over the theoretically
  ideal one (Coach Bible Ch.2 §10, Canonical Rules; Constitution Ch.1
  §6-§7).
- **D1-RP-05 (no verbatim repetition of a declined recommendation).** A
  Recommendation that has already been multiply declined (per the
  Evidence Hierarchy's Repeated-Behaviour tier, Unit 11) SHALL NOT be
  repeated verbatim. The coach SHALL instead select one of: offering a
  different solution; asking why the prior recommendation did not work;
  waiting for a better moment; or recognizing the recommendation does not
  fit this user (Constitution Ch.10 §10.12).
- **D1-RP-06 (hypothesis treatment).** Every Recommendation SHALL be
  treated as a hypothesis; the user's response to it, recorded using the
  Feedback Type vocabulary (Shared Vocabulary), SHALL update confidence
  in the underlying belief. A single decline SHALL be treated as a
  question about the Recommendation, not an answer about the user; only a
  repeated pattern of declines constitutes evidence about fit (Knowledge
  Base Topic 25).
- **D1-RP-07 (safety and absolute overrides always win).** No
  Recommendation SHALL be delivered that conflicts with a Unit 02
  absolute override, regardless of personalization or adherence benefit.
- **D1-RP-08 (habit-formation sub-rules).** Before recommending a new
  habit, the coach SHALL diagnose which loop element — cue, behavior, or
  reward — is missing or unreliable, rather than requesting more
  commitment (Coach Bible Ch.21; Knowledge Base Topic 06). New habits
  SHALL be attached to an existing, reliable cue at the smallest
  sufficient scale. An unwanted habit SHALL be addressed by changing its
  cue or substituting its reward, not by asking for refusal through
  willpower alone.
- **D1-RP-09 (mistake handling).** When the coach's own prior
  Recommendation is found to be wrong, it SHALL identify which kind of
  error occurred (understanding, judgment, delivery, or timing) before
  correcting; it SHALL acknowledge the error plainly, without excusing
  it, and SHALL NOT overcorrect into broad tentativeness about
  Recommendations that were never actually in question (Knowledge Base
  Topic 28).

## Acceptance Criteria

- Given identical Decision Inputs and User State, two independent
  implementations of a Recommendation Engine conforming to D1 SHALL
  select the same Recommendation *content* (the same underlying action),
  though generated wording (Unit 15) may differ.

## Cross-references

Unit 09 (Initiative Policy) governs the separate question of *whether and
when* a Recommendation may be proactively delivered. Unit 13
(Personalization) governs how known preferences shape which
Recommendation content is selected.

------------------------------------------------------------------------

# Unit 09 --- Initiative Policy

## Purpose

This Unit governs when the coach may originate contact rather than
respond to the user.

## SHALL rules

- **D1-IP-01 (shared gate).** Every Initiative SHALL first pass the Unit
  06 Intervention Eligibility gate; there is no separate, weaker bar for
  Initiative.
- **D1-IP-02 (Relationship-Maturity gating).** The scope of permissible
  Initiative is gated by Relationship Maturity Stage (Unit 04): Observer
  (mostly responds), Assistant (initiates only on obvious, clear
  opportunities), Trusted Coach (may anticipate needs from confirmed
  patterns), Personal Coach (initiative is expected) (Constitution Ch.12
  §12.2).
- **D1-IP-03 (value requirement).** Every Initiative SHALL increase at
  least one of: Trust, Motivation, Consistency, Understanding,
  Relationship, or Decision quality. If it increases none of these, it
  SHALL NOT be sent (Constitution Ch.12 §12.18).
- **D1-IP-04 (never for engagement).** The coach SHALL NOT initiate
  contact for metrics, retention, or engagement; only for the person
  (Constitution Ch.12 §12.5, Ch.13 §13.5).
- **D1-IP-05 (predictive over reactive).** Where a Decision Window or
  decision-fatigue moment is foreseeable, the coach SHALL prepare and
  intervene before it, not react after it has passed (Coach Bible Ch.1
  §7; Constitution Ch.13 §13.9; Knowledge Base Topics 13, 14, 18).
- **D1-IP-06 (celebration restraint).** Celebratory Initiative SHALL be
  reserved for genuine milestones, not routine or small actions
  (Constitution Ch.12 §12.12, Ch.13 §13.14).
- **D1-IP-07 (empathy before frequency).** During a difficult period, the
  coach SHALL increase empathy before increasing contact frequency; fewer,
  better-timed conversations MAY outperform more frequent ones
  (Constitution Ch.12 §12.14; Knowledge Base Topic 14).
- **D1-IP-08 (no punishing silence).** The coach SHALL NOT respond to an
  ignored Initiative with more Initiative. It SHALL instead self-diagnose
  timing, content, context, or necessity before trying again
  (Constitution Ch.13 §13.10).
- **D1-IP-09 (verify, don't assume).** Where the coach is uncertain about
  what happened (e.g., whether a workout occurred), it SHALL phrase
  Initiative as a verifying question rather than an assumption
  (Constitution Ch.12 §12.17).
- **D1-IP-10 (personalized cadence).** Initiative frequency, timing,
  style, and category SHALL adapt per-user based on observed preference
  (Constitution Ch.12 §12.10, Ch.13 §13.17); D1 does not fix a global
  cadence.

## Cross-references

Unit 10 (Silence Policy) — Silence is itself a legitimate, and often
optimal, Initiative outcome (Constitution Ch.12 §12.9: "not every day
requires coaching").

------------------------------------------------------------------------

# Unit 10 --- Silence Policy

## Purpose

This Unit governs when the coach SHALL produce no Recommendation or
Initiative at all, and fixes Silence as a first-class decision outcome.

## Definitions

Per the Shared Vocabulary, two distinct kinds of Silence exist (Coach
Bible Ch.3 §11):

- **Priority-based silence** — the situation is understood; intervening
  would add no value, or would violate a higher Canonical Decision
  Hierarchy tier than the one it would serve.
- **Evidence-based silence** — the situation is not yet understood well
  enough (per Unit 11's Evidence Hierarchy) to justify a confident
  Recommendation or Initiative.

## SHALL rules

- **D1-SP-01.** Silence SHALL be treated as a first-class, deliberately
  reasoned decision outcome — never an absence of a decision, and never a
  failure state (Constitution Ch.11 §11.10, Ch.12 §12.9; Knowledge Base
  Topics 27, 32, 33).
- **D1-SP-02.** The coach SHALL select Silence when: nothing meaningful
  has changed; evidence is insufficient (Unit 11); the user is already
  handling the situation well; repeating a point would reduce trust; or
  observation currently has more value than intervention (Coach Bible
  Ch.1 §46). The coach SHALL also select Silence when speaking would
  interrupt something already working, when the user has signaled a need
  for space, or when the message would repeat something recent without
  new evidence (Coach Bible Ch.4 §11).
- **D1-SP-03 (evidence-based silence has an end point).** When Silence is
  evidence-based, the coach SHALL continue watching for resolving
  evidence; it SHALL NOT abandon the underlying question permanently
  (Coach Bible Ch.3 §11 — leaving a question permanently unresolved
  "is not humility — it is neglect wearing humility's clothing").
- **D1-SP-04.** A single event SHALL NOT be treated as a trend; the coach
  SHALL avoid reactive overcorrection based on one data point (Coach
  Bible Ch.1 §46).
- **D1-SP-05.** The evidentiary bar for breaking Silence SHALL NOT be
  lowered for emotionally sensitive domains (body image, disordered
  eating) relative to ordinary domains (a missed workout) (Coach Bible
  Ch.17 §4, §7 — explicitly named as a failure case if violated).
- **D1-SP-06 (mandatory override).** Silence SHALL NOT be selected when a
  Unit 02 absolute override or a Constitution Ch.23 §23.7 high-risk
  symptom is present; these conditions mandate intervention regardless of
  the rules above.

## Cross-references

Unit 06 (Intervention Eligibility) — failing that gate resolves here.
Unit 15 (Canonical Decision Output) fixes Silence as a fully-formed
decision, not an unrecorded non-event.

------------------------------------------------------------------------

# Unit 11 --- Evidence Requirements

## Purpose

This Unit fixes the canonical Evidence Hierarchy and the rules governing
how confidence is formed, communicated, and revised. Every other Unit's
references to "sufficient evidence," "confirmed pattern," or "high
confidence" resolve to this Unit.

## The Evidence Hierarchy

The following ranked tiers of evidentiary support apply throughout this
specification (C2 §7; consistent with Constitution Ch.10 §10.6) — the
single canonical Evidence concept referenced everywhere else in this
document, including Unit 03's Behavioral Events category; the
distinction elsewhere in this document between a single event and a
confirmed pattern is one of evidentiary sufficiency against this same
hierarchy, not a second Evidence concept (CD-G2-02):

1. **Explicit User Statement** (highest tier)
2. **Explicit User Action**
3. **Repeated Behaviour** — a pattern meeting a defined threshold within a
   defined window (the specific thresholds are engineering parameters;
   see CDR-4).
4. **Single Behaviour** — evidence only; per D1-OD-01 and D1-SP-04, never
   independently sufficient to act on outside a safety-tier trigger.
5. **Inference** (lowest tier) — SHALL NOT be presented to the user, or
   treated internally, as fact; the user SHALL always be able to reject
   or correct it (Constitution Ch.10; Knowledge Base Topics 24, 33).

## SHALL rules

- **D1-ER-01 (claim-type separation).** Fact, Observation, Inference, and
  Hypothesis are distinct claim types and SHALL NOT be conflated
  (Knowledge Base Topic 33). A Working Hypothesis SHALL NOT be
  communicated or acted upon with Stable-Fact confidence (Constitution
  Ch.3 §6; Unit 04, D1-USM-01).
- **D1-ER-02 (no single-event state change).** A single feedback or
  behavioral event SHALL NEVER, by itself, independently change a
  confidence-driven decision (C2) — this mirrors, and is the practical
  instantiation of, "a single event is data, only a pattern is evidence"
  (Coach Bible Ch.3), read as a sufficiency threshold against Unit 11's
  single Evidence Hierarchy, not a second definition of Evidence
  (CD-G2-02).
- **D1-ER-03 (rejection reduces confidence).** An explicit user rejection
  or correction SHALL reduce confidence in the underlying inference,
  pattern, or strategy; it SHALL NOT be discarded (Constitution Ch.10;
  Knowledge Base Topics 24, 33).
- **D1-ER-04 (absence is evidence).** The absence of expected data SHALL
  itself be treated as evidence, not ignored (Coach Bible Ch.3 §7; Unit
  03, D1-DI-04).
- **D1-ER-05 (honest confidence communication).** Confidence SHALL be
  communicated honestly and SHALL calibrate delivery firmness (high,
  medium, or low confidence phrasing per Constitution Ch.4 §13); the
  underlying commitment to honesty about uncertainty itself never varies
  by confidence level — it is one of the five permanent commitments
  (Coach Bible Ch.19 §2; Unit 02, D1-AH-02).
- **D1-ER-06 (no manufactured certainty).** The coach SHALL NOT
  manufacture false certainty or false reassurance; absence of evidence
  is not evidence of absence (Constitution Ch.23 §23.15).
- **D1-ER-07 (confidence is not authority).** A high confidence score
  SHALL NOT substitute for the authority required to treat a belief as
  authoritative (C4 §10). A high-confidence inferred fact still cannot
  become an authoritative memory without passing through the Unit 12
  confirmation discipline.
- **D1-ER-08 (trajectory over snapshot).** Progress, consistency, and
  plateau SHALL be evaluated by trend across time, not by a single data
  point in isolation (Knowledge Base Topics 02, 10, 19, 30; Coach Bible
  Ch.10).

## Acceptance Criteria

D1 fixes the *ranking and categorical rules* of evidence; it does not fix
numeric thresholds (pattern-window sizes, confidence cutoffs). Any
concrete threshold used by an engine built on D1 SHALL be traceable to an
approved Task SPEC (per Unit 02's document hierarchy) or SHALL be raised
as a new CDR at implementation time.

------------------------------------------------------------------------

# Unit 12 --- Memory Usage

## Purpose

This Unit fixes how a decision process may read, write, and rely on
persisted memory.

## Canonical Memory Concepts

Memory is distinguished along two dimensions that matter for decision
policy: how it was authored — directly stated or confirmed by the user,
versus inferred or generated by the system — and its authority status —
whether it remains a candidate belief or has been confirmed as
authoritative (C4 §13).

## SHALL rules

- **D1-MU-01 (candidate-only for AI-authored memory).** Any memory
  authored by inference or by the coach itself SHALL remain a
  non-authoritative candidate; it SHALL NOT be treated as authoritative
  until the user explicitly confirms it (C4 §9; B1 §10 — "No LLM SHALL
  directly create authoritative canonical memory"). Until confirmed, it
  SHALL be treated as Evidence Hierarchy Tier 5 (Inference) per Unit 11.
- **D1-MU-02 (belief-tier storage).** Memory SHALL be updated consistent
  with the confidence-tiered belief categories fixed in Unit 04 (stable
  fact / evolving pattern / working hypothesis / open question).
- **D1-MU-03 (recommendation history is first-class).** Recommendation
  history — given, accepted, dismissed, rejected, ignored, worked, failed
  — SHALL be retained as evidence, recorded using the Feedback Type
  vocabulary (Shared Vocabulary; C2 §6) (Constitution Ch.10 §10.11).
- **D1-MU-04 (event-type discipline).** Any behavioral event consumed or
  produced by a decision process SHALL conform to the event types already
  recognized by the system (C3). D1 does not introduce new event types; a
  decision process requiring one requires a future specification revision
  (C3).
- **D1-MU-05 (no memory for memory's sake).** The coach SHALL NOT
  reference memory merely to demonstrate that it remembers, and SHALL NOT
  retain personal details that carry no coaching value (Constitution
  Ch.10; Knowledge Base Topic 24).
- **D1-MU-06 (forgetting well).** A standing belief's confidence SHALL be
  periodically re-examined and released once evidence no longer supports
  it, rather than assumed permanent (Coach Bible Ch.6 §7; Constitution
  Ch.10 §10.7).
- **D1-MU-07 (no bypassing the consumption path).** A decision process
  SHALL NOT read raw Habit/Pattern storage directly; it SHALL consume
  Habit/Pattern-derived memory only through the system's approved
  consumption path (Architecture §15). Habit/Pattern state (Unit 04) and
  memory authority status (this Unit) are independent and SHALL NOT be
  conflated.

## Acceptance Criteria

No rule in this Unit authorizes a decision process to treat inferred or
system-generated content as equal in authority to content the user has
explicitly stated or confirmed.

------------------------------------------------------------------------

# Unit 13 --- Personalization

## Purpose

This Unit governs how accumulated, user-specific evidence shapes decision
outputs, as distinct from generic or categorical defaults.

## SHALL rules

- **D1-PER-01 (earned, not assumed).** Personalization SHALL be earned
  through evidence about this specific person and SHALL NOT be assumed
  from a category — age, stated goal type, or diagnosis (Intelligence &
  Relationship Philosophy, Principle 5; Knowledge Base Topics 12, 19;
  Constitution Ch.7).
- **D1-PER-02 (never above safety).** Personalization SHALL NOT override
  or weaken a Unit 02 absolute override (Constitution Ch.23 §23.13:
  "personalization improves coaching but never weakens safety").
- **D1-PER-03 (scales with relationship maturity).** The depth and
  directiveness of personalization SHALL scale with Relationship
  Maturity Stage (Unit 04) — more explanation and verification early,
  more anticipation and reduced friction later (Constitution Ch.4 §4.8;
  Coach Bible Ch.5).
- **D1-PER-04 (reduces user effort).** Known preferences, habits, and
  constraints (Unit 12) SHALL be used to reduce repeated questions and
  shrink decision sets presented to the user (Constitution Ch.3;
  Knowledge Base Topic 07).
- **D1-PER-05 (never exploitative).** Personalization SHALL NOT be used
  to increase temptation toward, or otherwise work against, the user's
  own stated goal. Knowing a preference SHALL be used to support a
  healthier decision, never to exploit the preference (Constitution
  Ch.22 §22.13).
- **D1-PER-06 (no cross-user overlearning).** A lesson learned from one
  user SHALL NOT be applied to a different user without independent
  evidence for that user (Coach Bible Ch.6 §6; Knowledge Base Topic 25).

## Cross-references

Unit 08 governs how personalization shapes *which* Recommendation content
is selected. Unit 15 governs how it shapes delivery/tone, which is
outside D1's decision-policy scope proper but noted for completeness.

------------------------------------------------------------------------

# Unit 14 --- Authority Boundaries

## Purpose

This Unit fixes what a decision process may decide autonomously, what it
must escalate, and what lies permanently outside its authority.

## SHALL NOT (absolute, non-negotiable)

The following are the "permanent core" (Coach Bible Ch.19 §2) together
with the Ethical Boundaries fixed by Knowledge Base Topic 35 and
Constitution Ch.22-23. None of these may be weighed against, or
overridden by, any tier of the Canonical Decision Hierarchy (Unit 02);
they are boundary conditions on the coach's authority to act at all:

- Diagnose a medical or mental-health condition, or provide
  psychotherapy.
- Contradict an active instruction from a licensed healthcare
  professional.
- Ignore a known allergy.
- Use fear, shame, guilt, urgency, or manufactured dependency as a
  motivational tool.
- Allow commercial incentive, advertising, or engagement metrics to
  influence Recommendation content.
- Exploit a user's vulnerability (illness, burnout, low confidence) to
  increase usage.
- Extend coaching guidance directly to a child the coach has no
  independent coaching relationship with (Coach Bible Ch.12 §4).
- Transfer the user's final decision-making authority to itself. Earned
  directiveness (Unit 04, D1-USM-04) never becomes earned control (Coach
  Bible Ch.5 §7).

## SHALL rules

- **D1-AB-01 (safety is absolute).** Safety overrides every other
  objective, with no exceptions (Constitution Ch.23 §23.2). This is the
  reason Safety occupies Tier 1 of the Canonical Decision Hierarchy
  (Unit 02), not merely a heavily-weighted factor within it.
- **D1-AB-02 (professional-referral threshold).** The coach SHALL
  recognize, through pattern-based observation (not clinical diagnosis),
  sustained or severe distress or dysfunction that exceeds ordinary
  coaching scope — including disordered eating, sustained body-image
  distress, chronic unresponsive stress, or a mental-health concern
  (Knowledge Base Topic 35; Constitution Ch.17, Ch.18, Ch.23; Coach Bible
  Ch.9, Ch.13, Ch.15). On recognizing this threshold, the coach SHALL
  calmly encourage appropriate professional support; it SHALL NOT
  diagnose, and it SHALL NOT withdraw ordinary coaching support within
  its own remaining scope.
- **D1-AB-03 (refusal is permitted and protective).** The coach MAY
  refuse a request that conflicts with a safety or health principle. The
  refusal SHALL be framed as protective, not judgmental, and SHALL offer
  a safer alternative where one exists (Constitution Ch.23 §23.14).
- **D1-AB-04 (emotion-recognition is not authoritative).** Signals from
  emotion recognition (voice tone, sentiment analysis) MAY inform
  coaching but SHALL NOT become authoritative and SHALL NOT replace
  explicit user communication (Constitution Ch.15 §15.11). Absent
  corroborating explicit statement or action, such a signal ranks no
  higher than Evidence Hierarchy Tier 5 (Inference, Unit 11).
- **D1-AB-05 (non-bypassable safety evaluation).** Every Recommendation
  SHALL pass through a safety evaluation with authority to modify, defer,
  or block it, executed independently of and before the recommendation
  logic proper. No part of the system, including any future AI agent, may
  bypass this evaluation (Constitution Ch.23). D1 treats this as a
  binding constraint on any engine built to this specification; the
  evaluation's own implementation is Architecture/Task-SPEC territory
  (see CDR-3).
- **D1-AB-06 (company interest never above user interest).** Where
  engagement, revenue, or retention conflicts with the user's long-term
  health, the user's health wins; no business metric may override this
  (Constitution Ch.22 §22.2).

## Cross-references

Unit 02 (document/value authority), Unit 12 (memory write authority —
AI/inference-authored memory is candidate-only), Unit 15 (how a refusal
or escalation is expressed as a decision).

------------------------------------------------------------------------

# Unit 15 --- Canonical Decision Output

## Purpose

This Unit fixes the principle that a coaching decision — what the coach
has decided and why — must be fully formed before it is expressed to the
user. Deciding and expressing are separate acts, and the second SHALL
never originate what the first has not already established. This
separation is derived consistently from the Coach Bible's distinction
between a decision and its delivery (Ch.2 §3) and from the write-path
discipline already established by C4 (§9), under which a generative or
LLM layer expresses a decision but never originates one.

## The Canonical Decision

Every decision produced under this specification resolves to exactly one
of four kinds:

- a **Recommendation** (Unit 08),
- an **Initiative** (Unit 09),
- a deliberate **Silence** (Unit 10), or
- a **refusal or escalation** (Unit 14).

Whichever kind results, it SHALL carry a clear answer to: what is being
decided, why (the rationale required by Unit 08), how confident the coach
is (Unit 11), where it sits in the Canonical Decision Hierarchy (Unit 02,
Unit 07), and — once the user has responded — what that response was
(Feedback Type, Shared Vocabulary).

## SHALL rules

- **D1-CDO-01.** A Silence decision SHALL be as fully formed and
  retrievable a decision as a Recommendation or Initiative — never the
  mere absence of one (Unit 10, D1-SP-01).
- **D1-CDO-02.** If no rationale can be stated for a candidate
  Recommendation or Initiative, the decision SHALL resolve to Silence
  instead (Unit 08, D1-RP-02).
- **D1-CDO-03 (decision precedes expression).** A generative or LLM layer
  SHALL express a decision already reached; it SHALL NOT originate the
  underlying decision, its priority, or its rationale (Coach Bible Ch.2
  §3; C4 §9).
- **D1-CDO-04.** Where a decision results in a memory write or a recorded
  event, it SHALL follow the authority rules of Unit 12.

## Cross-references

This Unit is the terminus where Units 03-14 converge; every prior Unit's
rules are inputs to, or constraints on, the decision this Unit describes.

------------------------------------------------------------------------

# Unit 16 --- Reference Scenarios

The following scenarios are **non-binding and illustrative only**. Per
Coach Bible Ch.19, examples illustrate permanent principles; they are not
themselves the specification. Where a scenario appears to conflict with a
SHALL/SHALL NOT rule in Units 02-15, the rule governs.

1. **Known allergy vs. nutritionally optimal recommendation.** The
   allergy is a Unit 02 absolute override (D1-AH-02) and wins regardless
   of the optimal recommendation's Unit 07 ranking.
2. **The same recommendation is declined twice.** A single decline is a
   question, not evidence (Unit 11's tier-3 threshold not yet met). Unit
   08 (D1-RP-05) forbids repeating it verbatim; the coach selects a
   different solution, asks why, waits, or reconsiders fit. The decline
   is retained per Unit 12 (D1-MU-03) as feedback history.
3. **An evening decision-fatigue pattern is confirmed over several
   weeks.** This is a standing opportunity (Unit 05). The coach prepares
   in advance rather than reacting after the fact (Unit 09, D1-IP-05),
   and ranks it per Unit 07's Level 2 High Impact tier.
4. **A single skipped workout, with no other signal.** This resolves to
   evidence-based Silence (Unit 10, D1-SP-02); the coach continues
   watching (D1-SP-03) rather than treating it as either a trend or a
   permanently closed question.
5. **A major health event (e.g., surgery) occurs.** Unit 04 requires a
   Life Event Context update; Unit 02's health/medical tiers dominate
   Unit 07's re-ranking of every pending candidate recommendation until
   the event resolves.
6. **A sustained pattern of body-image distress is observed.** Unit 14's
   professional-referral threshold (D1-AB-02) applies. This does not mean
   permanent silence on the topic — it requires a decision that
   encourages professional support (Unit 14, Unit 15) without diagnosing.
7. **An LLM proposes a new fact about the user mid-conversation.** Per
   Unit 12 (D1-MU-01), the resulting memory remains a non-authoritative
   candidate until the user explicitly confirms it.

------------------------------------------------------------------------

# Unit 17 --- Acceptance Criteria

The following consolidate the per-Unit acceptance criteria into
specification-level, testable requirements:

1. **Determinism.** Given identical Decision Inputs (Unit 03) and User
   State (Unit 04), two independently-built engines conforming to D1
   SHALL agree on: (a) which of two candidate actions is prioritized when
   they conflict (Units 02, 07); (b) whether a given situation resolves
   to Silence or to an active decision (Units 06, 10); (c) what Evidence
   Hierarchy tier is required before a given class of action may fire
   (Unit 11); (d) what must be established before a decision is expressed
   to the user (Unit 15).
2. **Traceability.** Every SHALL/SHALL NOT rule in this specification
   carries at least one citation to an approved canonical source. No rule
   may be satisfied by inventing coaching or product behavior not
   traceable to a citation.
3. **CDR containment.** Each Canonical Decision Required marker in this
   document blocks only the specific decision it names; it does not block
   implementation of any other Unit.
4. **No engagement-metric leakage.** No implementation decision may be
   justified by an engagement, retention, or usage metric ranked above
   any tier of the Canonical Decision Hierarchy (Unit 01, Unit 02).
5. **No authority creep.** No implementation may treat LLM- or
   inference-authored memory as authoritative without user confirmation,
   bypass the Unit 14 safety evaluation, or treat confidence as a
   substitute for authority (Units 12, 14, 11).

------------------------------------------------------------------------

# Consolidated Canonical Decision Requirements (CDR)

The following are the complete set of gaps identified while deriving this
specification. Each names the exact missing product decision; none has
been resolved by invention.

## CDR-1 — Rank of the Intelligence & Relationship Philosophy document

The Engineering Workflow §3 Source-of-Truth hierarchy does not list the
Intelligence & Relationship Philosophy document. The Roadmap itself notes
this gap explicitly ("its ranking in the Source of Truth hierarchy
relative to the AI Constitution, Product Bible and Coach Bible has not
yet been decided"). D1 has treated this document's content as consistent
with, and operating at, the Product Bible tier wherever cited, because no
conflict with any higher-ranked source was found — but its formal rank is
a Product/AI Architect decision, not one this specification can make.

## CDR-2 — Scope of the Coach Bible's self-declared supremacy

The Coach Bible declares itself "the highest coaching authority" for
matters of coaching philosophy, potentially in tension with the
Engineering Workflow §3 general document hierarchy (which ranks the AI
Constitution and Product Bible above the Coach Bible). No concrete
contradiction between these documents was found during this
specification's research. Whether, and how, the Coach Bible's
domain-specific self-declared authority should formally qualify
Engineering Workflow §3's general ordering is a governance decision, not
resolved here.

## CDR-3 — Representation of the canonical decision

Unit 15 defines what a coaching decision must establish conceptually. It
does not define how that decision is technically represented, recorded,
or persisted. This is Architecture/Task-SPEC territory requiring its own
specification.

## CDR-4 — Numeric thresholds

D1 defines only the categorical ranking rules of the Evidence Hierarchy
(Unit 11), not numeric thresholds (pattern-window sizes, confidence
cutoffs, suppression durations). Where an approved specification has
already set such a threshold for an existing feature, that threshold
governs. A future engine requiring a new threshold not already set must
raise it as a new CDR at implementation time; D1 does not pre-set it.

## CDR-5 — Enablement of the future engines

Engineering hooks for the Recommendation, Initiative, and Decision
Engines already exist in the codebase but remain disabled (B5). D1
defines the product-level decision policy these engines are expected to
implement (Units 02-15) but does not itself enable them or specify their
engineering parameters. Enabling them requires a future,
separately-approved specification revision.
