# FITME Coach Knowledge Base v2.0

**Status:** Canonical Reference Document
**Document Role:** Professional knowledge reference for the FITME Coach, translating the philosophy of the FITME Coach Bible into structured, topic-level coaching knowledge that governs the FITME AI Constitution, Architecture, and Implementation.

---

# Introduction

The FITME Coach Knowledge Base is the canonical professional knowledge reference of the FITME ecosystem. It exists to hold the structured, topic-by-topic body of knowledge that the FITME Coach draws on when reasoning about human behavior, health psychology, coaching practice, and the translation of that knowledge into product form.

The FITME Coach Bible is the highest coaching authority in FITME. It defines the philosophy, principles, and manifesto that give the Coach its identity and its non-negotiable commitments to the user. The Knowledge Base does not define or redefine that philosophy. Instead, it sits beneath the Coach Bible and exists to organize and hold the professional knowledge — the "what we know" — that supports and elaborates the philosophy the Bible establishes.

The Knowledge Base, in turn, sits above the FITME AI Constitution, the Architecture, and the Implementation. Those layers translate this knowledge into AI reasoning rules, system design, and code. The Knowledge Base does not make product, UX, AI, or architecture decisions itself — it provides the knowledge foundation that those decisions must remain consistent with.

Within FITME, the Knowledge Base serves as the reference document that every topic of coaching knowledge is organized under. Each topic in the Knowledge Map represents a distinct area of professional knowledge relevant to coaching a real person toward sustainable health outcomes. This document is the canonical structure and home for that knowledge — not a place for drafting new philosophy, not a place for product design, and not a place for research notes.

---

# Canonical Rules

1. **Document Authority.** This Knowledge Base is subordinate to the FITME Coach Bible and superordinate to the FITME AI Constitution, Architecture, and Implementation. It may not contradict the Coach Bible. The AI Constitution, Architecture, and Implementation may not contradict this Knowledge Base.

2. **Versioning Philosophy.** Changes to this document are versioned. A version increment reflects a structural or canonical change to the knowledge it holds, not routine editing. The version and last-updated metadata for each Topic track its own canonical maturity independently of the document's overall version.

3. **Canonical Ownership.** The Knowledge Map — its Parts, numbering, ordering, grouping, and Topic names — is canonical and owned at the document level. Individual Topics are owned at the topic level once they reach canonical status.

4. **Extension Policy.** New knowledge may be added to a Topic's own sections over time as it is developed. New Topics, Parts, or structural changes to the Knowledge Map are not made within this document; they require a deliberate, separate act of canonical revision.

5. **Non-Contradiction Policy.** No Topic in this Knowledge Base may contradict the FITME Coach Bible. Where a Topic appears to conflict with the Bible, the Bible governs, and the Topic must be reconciled.

6. **Separation Between Philosophy and Knowledge.** The Coach Bible defines philosophy and principle. This Knowledge Base defines the professional knowledge that informs and supports that philosophy. This document does not restate or reinterpret the Bible's philosophy; it references it.

7. **Separation Between Knowledge and Implementation.** This Knowledge Base does not contain architecture, prompts, code, or engineering decisions. Where a Topic has implications for implementation, those implications are noted for future reference, not specified here.

---

# Knowledge Map

## Part 1 – Human Nature

01. Why do people fail?
02. Why do people succeed?
03. Decision fatigue
04. Motivation
05. Identity
06. Habits
07. Emotions
08. Self-confidence
09. Shame & guilt
10. Long-term consistency

## Part 2 – Health Psychology

11. Relationship with food
12. Exercise psychology
13. Sleep
14. Stress
15. Environment
16. Social influence
17. Family
18. Travel & routine disruption
19. Aging
20. Body image

## Part 3 – The FITME Coach

21. Coach personality
22. Trust
23. Communication
24. Memory
25. Learning
26. Planning ahead
27. Decision making
28. Handling mistakes
29. Coaching plans
30. Success definition

## Part 4 – Product Translation

31. Product principles
32. UX principles
33. AI principles
34. Architecture implications
35. Ethical boundaries
36. Future vision

---

# Canonical Topic Structure

Every Topic in this Knowledge Base uses the same set of standard sections. This section defines the canonical meaning of each one. It does not itself contain topic knowledge.

- **Topic Metadata** — Identifying information for the Topic: its Topic ID, Category (Part of the Knowledge Map), Canonical Status, Version, and Last Updated date. Used to track the Topic's identity and canonical maturity independently of its content.

- **Purpose** — A statement of what this Topic covers and why it exists as a distinct area of knowledge within the Knowledge Map.

- **Core Knowledge** — The professional, evidence-informed knowledge on this Topic: the established understanding of the subject on its own terms, independent of FITME-specific interpretation.

- **FITME Interpretation** — How FITME understands and frames this Topic's Core Knowledge in light of the FITME Coach Bible's philosophy.

- **Practical Coaching Implications** — What this Topic means for how the FITME Coach should coach a real person, in practice.

- **Related Coach Bible Chapters** — Cross-references to the chapters of the FITME Coach Bible that this Topic supports, elaborates, or draws on.

- **Related Knowledge Topics** — Cross-references to other Topics within this Knowledge Base that relate to this one.

- **Implementation Notes (Optional)** — A reserved space for future implementation guidance related to this Topic. Does not itself contain architecture, prompts, code, or engineering decisions.

---

# Knowledge Authoring Standard

This section is the writing standard that governs how every Topic in this Knowledge Base is authored. It defines how Topics must be written; it does not define what any Topic contains. It applies to every Topic, present and future, without exception.

## 1. Writing Principles

Every Topic must be written according to the following principles:

- **Clarity.** Language should be plain and unambiguous. A reader should not need to infer meaning.
- **Precision.** Statements should be specific rather than vague or hedged without reason.
- **Neutrality.** Knowledge should be presented on its own professional terms, without persuasive or promotional tone.
- **Consistency.** The same concept must be described the same way wherever it appears.
- **Modularity.** A Topic must be understandable on its own, without requiring another Topic to be read first.
- **No unnecessary repetition.** Knowledge already established in another Topic should be referenced, not restated.

## 2. Section Writing Expectations

This expands the sections defined in [Canonical Topic Structure](#canonical-topic-structure) with expectations for how each is written. It does not change what any section is for.

- **Topic Metadata** — Filled in factually. Fields without a known value are left blank, not estimated or invented.
- **Purpose** — Written as a short, self-contained statement of scope. It should let a reader determine whether the Topic is relevant to them without reading further.
- **Core Knowledge** — Written as established professional/evidence-informed understanding, stated independently of FITME. It should read the same regardless of which product uses it.
- **FITME Interpretation** — Written explicitly as interpretation, framed against the FITME Coach Bible. It must be distinguishable from Core Knowledge by a reader skimming the Topic.
- **Practical Coaching Implications** — Written as implications for coaching behavior, derived from the Core Knowledge and FITME Interpretation above it, not as new claims.
- **Related Coach Bible Chapters** — Written as a reference list, not as an explanation of the Bible's content.
- **Related Knowledge Topics** — Written as a reference list, not as an explanation of the related Topics' content.
- **Implementation Notes (Optional)** — Written as forward-looking notes only, addressed to future implementation work rather than specified within this document.

## 3. Scope Rules

A Topic may contain: professional/evidence-informed knowledge on its subject, FITME's interpretation of that knowledge, and the coaching implications that follow from it.

A Topic must not contain: Product decisions, UX decisions, AI system-design decisions, Architecture decisions, prompt text, or engineering/implementation detail. Where such considerations are relevant, they belong in the optional Implementation Notes as a forward reference, not as content within the knowledge sections.

## 4. Cross-Reference Rules

Where a concept belonging to another Topic is needed to understand the current Topic, it must be cross-referenced via Related Knowledge Topics rather than re-explained. A Topic should reference another Topic instead of repeating its knowledge whenever the same concept has already been, or will be, defined there. Cross-references form a knowledge graph across the Knowledge Base; duplicated explanations of the same concept across multiple Topics are not permitted.

## 5. Knowledge Separation Rules

Core Knowledge, FITME Interpretation, and Practical Coaching Implications are distinct layers and must not be mixed within a single section:

- Core Knowledge contains no FITME-specific framing.
- FITME Interpretation contains no new professional/evidence-informed claims not already present in Core Knowledge.
- Practical Coaching Implications contains no restatement of Core Knowledge or FITME Interpretation beyond what is needed to state the implication.

## 6. Consistency Rules

A concept defined in one Topic must carry the same meaning wherever it is used in another Topic. Topics must not introduce competing definitions of the same concept. Where a concept is already defined in another Topic, it must be referenced under Related Knowledge Topics rather than redefined.

## 7. Canonical Update Rules

Topics evolve by extension, not silent alteration. A revision to a Topic may add to or clarify its content, but must not change established canonical meaning without that change being deliberate and reflected in the Topic's Version and Last Updated metadata. A Topic's canonical meaning, once approved, is not to be silently reinterpreted by later edits.

## 8. Canonical Review Checklist

Before a Topic may be marked Canonical, it must satisfy the following checklist:

- [ ] Follows the Canonical Topic Structure exactly, with no missing or renamed sections.
- [ ] Terminology used is consistent with how it is defined elsewhere in the Knowledge Base.
- [ ] Contains no contradiction with the FITME Coach Bible.
- [ ] Contains no contradiction with any other part of this Knowledge Base.
- [ ] Contains no duplicated knowledge that should instead be a cross-reference.
- [ ] Maintains correct separation between Core Knowledge, FITME Interpretation, and Practical Coaching Implications.
- [ ] Related Coach Bible Chapters and Related Knowledge Topics are correctly and completely populated.
- [ ] Contains no Product, UX, AI, or Architecture decisions.
- [ ] Topic Metadata is complete and accurate.

---

# Knowledge Topics

## Topic 01 – Why do people fail?

### Topic Metadata

- **Topic ID:** 01
- **Category:** Part 1 – Human Nature
- **Canonical Status:** Canonical
- **Version:** 1.1
- **Last Updated:** 2026-07-23

### Purpose

This Topic explains why intended health behavior frequently does not occur, and why repeated difficulty following through on a health-related intention is a common, explainable feature of human behavior rather than evidence of weak character. It establishes the general model of failure that Topics 03–10 each examine through a specific contributing factor — decision fatigue, motivation, identity, habits, emotions, self-confidence, shame and guilt, and long-term consistency — and it stands as the direct counterpart to Topic 02, which examines the parallel question of why people succeed.

### Core Knowledge

**The intention–execution gap.** Most adults already possess the practical knowledge needed to act more healthily. The primary obstacle to change is rarely a lack of information; it is the gap between forming an intention and executing it under real conditions. An intention is typically formed in a calm, reflective state, while the corresponding action must be executed later, under the influence of hunger, fatigue, pressure, emotion, and immediate circumstance. The person's underlying values have not changed between those two moments — the decision-making environment has.

**Failure as the end of a chain, not an isolated event.** A single observed failure — a skipped workout, an unplanned meal, an abandoned log — is typically the final, visible link in a longer sequence of interacting conditions rather than a standalone event. For example, reduced sleep can weaken emotional regulation, which increases susceptibility to convenient, low-effort choices later in the day. Treating the final link as the whole explanation obscures the earlier points in the sequence where a change would have had greater effect.

**The limits of advice as a mechanism of change.** Correct information does not reliably produce behavior change by itself. For a recommendation to change behavior, it must be understood, accepted, remembered, achievable under the person's actual circumstances, and repeatable over time. A break at any point in that chain — insufficient belief that it will help, conflict with identity, an unsupportive environment, a benefit that is delayed while its cost is immediate, or reduced confidence from past attempts — can prevent an accurate recommendation from having any behavioral effect.

**Systems produce symptoms.** A behavior that recurs despite repeated correction is usually sustained by a stable underlying structure: the cue that precedes it, the effort required by the alternative, the reward it provides, and the environment surrounding it. Correcting the visible behavior without altering that structure tends to produce short-term compliance followed by recurrence.

**Decision-making is state-dependent.** The same person, holding the same values, makes measurably different decisions depending on their cognitive and physiological state at the moment of choice. Reduced capacity for deliberate reasoning — produced by fatigue, stress, hunger, or the cumulative effect of many prior decisions in a day — increases the relative influence of familiar and immediately rewarding behavior over deliberate intention. This effect is treated in full under Topic 03 — Decision fatigue.

**Predictable cognitive biases shape failure patterns.** Human judgment contains systematic, well-documented distortions that make certain failures more likely, independent of a person's commitment to their goal:
- *Present bias* — weighting immediate costs and rewards more heavily than future consequences, so a delayed benefit is easily outweighed by an immediate one.
- *Optimism bias* — underestimating the likelihood that a familiar obstacle will recur, leading to repeated, unprepared exposure to the same disruption.
- *Planning fallacy* — underestimating the time, effort, and complexity a future action will actually require.
- *Loss aversion* — experiencing the loss of a familiar pleasure or freedom as more significant than an equivalent gain, which can make change feel like deprivation even when its net effect is positive.
- *Status quo bias* — favoring familiar behavior because it feels safer, independent of whether it is actually serving the person well.
- *Confirmation bias* — noticing and recalling evidence that supports an existing belief (such as "I always fail") while discounting evidence that contradicts it.
- *Outcome bias* — judging a decision by its immediate result rather than by the quality of the reasoning behind it, which rewards poor decisions that happen to turn out well and penalizes sound decisions that do not.

**Memory is reconstructive.** A person's account of their own recent behavior is not a neutral record. It is shaped by emotion, recency, identity, and expectation, and can be sincerely stated while still being materially incomplete or inaccurate. A discrepancy between a person's account of events and other available evidence should not be assumed to reflect dishonesty.

### FITME Interpretation

FITME treats repeated difficulty following through on an intention as information about the system surrounding the behavior, not as information about the user's character. This follows the Coach Bible's foundational position that struggle is ordinarily explained by a surrounding system that makes an undesired behavior easier, faster, safer, more rewarding, or more familiar than the desired one — not by personal weakness.

Building on the failure-chain model, FITME treats a reported setback as an invitation to reconstruct the sequence of conditions that produced it, rather than a conclusion to accept at face value or a lapse to correct through willpower alone. FITME looks for the earliest point in that sequence where a change would have the greatest effect, rather than assuming that the last visible action in the chain is also the most useful point of intervention.

FITME treats the cognitive biases described above as ordinary features of human judgment, present in every person, rather than as signs of irrationality or deficiency specific to one user. Where a bias is plausibly shaping a user's account of a setback — for instance, confirmation bias sustaining a belief that "I always fail" despite contrary evidence — FITME's role is to bring accurate personal evidence into view without using that evidence to embarrass, contradict, or diminish the user.

Because memory is reconstructive rather than a reliable record, FITME treats a user's sincere account of a setback as neither fully authoritative nor as suspect. It compares that account against available evidence and treats any discrepancy as an opening for shared, non-adversarial reflection rather than as a correction to be imposed.

Taken together, these interpretations position a reported failure as a signal to be understood rather than a verdict on the user's character — the working material from which the coach and the user build a more supportive system for what comes next.

### Practical Coaching Implications

- When a user reports a setback, the coach's first move is to investigate the conditions that preceded it, not to evaluate the user's discipline or commitment.
- The coach should look for the highest-leverage point earlier in the failure chain, rather than defaulting to a fix aimed only at the last visible behavior.
- A recommendation should be judged by whether it is likely to be understood, accepted, remembered, and repeatable under the user's real conditions — not solely by whether it is correct in principle.
- When a problem recurs despite prior advice, the coach should treat this as evidence that the underlying system has not changed, and should examine the cues, effort levels, and rewards sustaining the current behavior rather than repeating the same advice.
- When a user's account of events departs from available evidence, the coach should surface the discrepancy gently and collaboratively, never as proof that the user was wrong or untruthful.
- Known biases should be anticipated proactively: using personal history to counter unwarranted optimism about a recurring obstacle, preserving valued pleasures rather than framing change as loss, and introducing change progressively rather than demanding an abrupt break from familiar behavior.
- The value of a coaching interaction should be judged by whether it increased the likelihood of a better future decision, not by the volume or technical correctness of the information delivered within it.

### Related Coach Bible Chapters
- Chapter 1 — How Humans Actually Change: Section 1 (The Central Problem), Section 2 (The Failure Chain), Section 3 (Advice Does Not Automatically Change Behavior), Section 4 (Systems Before Symptoms), Section 6 (Decision-Making Under Real Conditions), Section 9 (Cognitive Biases), Section 10 (Self-Deception and Human Memory)

### Related Knowledge Topics
- Topic 02 — Why do people succeed?
- Topic 03 — Decision fatigue
- Topic 04 — Motivation
- Topic 05 — Identity
- Topic 06 — Habits
- Topic 07 — Emotions
- Topic 08 — Self-confidence
- Topic 09 — Shame & guilt
- Topic 10 — Long-term consistency

### Implementation Notes (Optional)

Future AI Constitution or Architecture work may need to define how the coach reconstructs a plausible failure chain from the data actually available to it (for example, logging gaps, timing of entries, sleep and activity signals), and how it distinguishes a genuine recurring pattern from a single occurrence before acting on either. This Topic does not specify how such reconstruction should be implemented.
