// ══════════════════════════════════════════════════════════════════
// FitMe — Safety Layer (SL-001, docs/specs/SL-001_SPEC_v1.0.md, RCD-01
// through RCD-14, docs/governance/FITME_Safety_Layer_Canonical_Decision_
// Package_v2.0.md)
// Exclusive responsibility: the production implementation behind the
// existing SafetyIntegrationPort (js/coachDecisionSystem/
// safetyIntegrationPort.js, TASK-006 §21.8) — Stage 8 disqualify() (D1-AH-02
// absolute overrides, SPEC Ch.14), Stage 9 finalReview() (the full Safety
// Decision Matrix, SPEC Ch.15-18), and the Stage 3 safety-triggered-
// Opportunity detection contribution (SPEC Ch.9-10), mirroring exactly the
// existing detectInitiativeOpportunities()/InitiativeEngine.detectOpportunities()
// dispatch pattern already established for the Initiative Engine
// (internalPipelineOrchestrator.js, TASK-005).
//
// Runtime unit of evaluation is the Canonical Safety Rule (RCD-14), not
// RiskType/reasonCode/any "Primary Safety Conflict" in isolation: each
// matched Rule independently derives RiskType/EvidenceConfidence/
// Correctability/Urgency (RCD-12.A-D) and its own Candidate Disposition
// (RCD-12.E); cross-Rule disposition precedence (RCD-09/RCD-12, RCD-14.B)
// then selects the winning disposition; the same-disposition tie-break
// (RCD-14.C: Urgency -> EvidenceConfidence -> Canonical Safety Rule Order)
// selects the Primary Rule Result; every other matched Rule supporting the
// winning disposition populates secondaryReasonCodes (RCD-14.D).
//
// CSR-001 (docs/specs/CSR_001_SPEC_v1.0.md) — matchCanonicalSafetyRules() below now implements
// the first real Canonical Safety Rule: an explicit, user-reported medical restriction (USC-001's
// userSafetyContext + USP-001's userSafetyProvenance, joined by sourceMemoryId — never positional,
// never cross-record) conflicting with a RUNNING Candidate (MAI-001's actionIdentity). This is the
// ONLY rule this function can ever match — every other Candidate/context combination still yields
// zero matched Rules, exactly as before. No general Health/Safety Profile data source exists
// anywhere in this repository's actual Pipeline Context (the broader Repository Gap
// memoryLayer.js/initiativeEngine.js already document elsewhere — lifeEventContext, capacityState,
// disruption/milestone detection — remains open and is NOT resolved by this Work Item); CSR-001
// consumes only USC-001/USP-001/MAI-001's own already-published, narrow contracts, none of which
// is a general Health/Safety Profile. The rule is reachable via Stage 8's own candidate-carrying
// call path (§16/§18 of the SPEC), and — per the Stage-9 Winning-Candidate Safety Input Canonical
// Decision (docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md,
// superseding AD-MAI-01's decisionFormation.js-untouched constraint for this one narrow purpose) —
// also via Stage 9's finalReview() call path for a SINGLE_WINNER Terminal Decision, which now
// receives the real winning Candidate as its third argument. The Stage-9 call path still returns []
// whenever no candidate is supplied (the TIED_SET case, explicitly out of scope for that Canonical
// Decision, and any direct call omitting the argument) — see matchCanonicalSafetyRules() below.
//
// A second, narrower gap: RCD-13.D requires a MODIFIED SafetyReviewResult's modifiedContent to be
// non-null, but no canonical source (D1, D2, D3, T006, SLDP, or the SL-001 SPEC) defines a
// bounded-modification content-generation algorithm — deciding HOW to alter a Candidate's content
// is Product/coaching-content-authoring work, not an Engineering detail (D1-CDO-03/SPEC Ch.19's
// Expression-boundary principle: "a generative layer SHALL express a decision already reached; it
// SHALL NOT originate the underlying decision"). finalReview() below honestly returns
// modifiedContent: null rather than fabricating content, which decisionFormation.js's own
// pre-existing, unmodified invariant check (`if (!isPlainObject(reviewResult.modifiedContent))
// return ABORTED`) already, correctly, Pipeline-Aborts on — no new abort path is invented.
//
// WP0 Phase D.6 UPDATE (supersedes the D.4-era disclosure below, kept for its own historical
// record): matchGovernedRiskCharacteristicRule() now CAN reach MODIFIED, but only through
// governedCorrectabilityWithSafeAlternativeGate() consulting genuinely independently-derived
// evidence (candidate.safeAlternativeCharacterization, produced exclusively by
// internalPipelineOrchestrator.js's own re-characterization step, Phase D.6) — never from a
// proposing capability's own bare safeAlternative presence or any self-asserted claim. When
// MODIFIED is reached, finalReview() below sources modifiedContent from the SAME
// candidate.safeAlternative content that gate already verified was cleared, never fabricated,
// never re-derived a second, different way.
//
// D.4-era disclosure (historical, superseded by the paragraph above): "matchGovernedRiskCharacteristicRule
// does NOT make MODIFIED reachable: its own governedCorrectabilityWithSafeAlternativeGate() always
// selects REQUIRES_INTENT_CHANGE, by design (a model-proposed safeAlternative's bare presence is
// never sufficient evidence of safety)... MODIFIED remains, in practice, as unreachable today as it
// was before this Rule existed." — the bare-presence protection this paragraph describes is fully
// preserved by Phase D.6 (see the gate's own current header); only the previously-nonexistent
// governed evidence contract needed to exist for MODIFIED to become reachable.
//
// ══════════════════════════════════════════════════════════════════
// WP0 Phase D.4 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §12/§13/§14, Revision 2,
// Product+Architecture APPROVED) — matchGovernedRiskCharacteristicRule() below is the approved
// Canonical Safety Rule for governed risk-characteristic evidence (§13: "exactly one new Rule
// function is required... the taxonomy's own generality is precisely what avoids needing a rule
// per domain"). It is additive to CANONICAL_SAFETY_RULES exactly like TRR-001's own two prior
// extensions (matchWalkingMedicalRestrictionRule/matchUnresolvedActivitySafetyCoverageRule) — same
// array, same evaluateRulePredicate()/reasonCodeForRule()/selectWinningDisposition()/
// selectPrimaryAndSecondary() machinery, zero new enum values (RISK_TYPES/EVIDENCE_CONFIDENCE/
// CORRECTABILITY/URGENCY all reused, unmodified), zero new predicate branches in
// evaluateRulePredicate() (already written generically enough to include the ESCALATED/MODIFIED
// branches this Rule activates for the first time, per the file's own pre-existing header note
// two paragraphs above).
//
// Runs UNCONDITIONALLY for every Candidate reaching Stage 8/9 (Round-2 binding decision,
// §09.3/§11/§13/§26 item 2 of the Sub-Spec): it reads only candidate.riskCharacteristicTags,
// never any capability's own registered riskCharacteristicDimensions declaration — an incorrect,
// stale, or empty declaration has zero bearing on whether this Rule executes or what it finds.
//
// TRR zero-drift (golden-master OUTCOME equivalence, not code-path exemption — the Sub-Spec's own
// Round-2 reconciliation): this Rule executes against TRR-produced Candidates the same as any
// other. As of Phase D.4 (this paragraph's original writing), it contributed nothing to them
// PROVABLY BY CONSTRUCTION — no code anywhere in this repository ever set riskCharacteristicTags
// on a real Candidate object.
//
// WP0 Phase D.6 UPDATE: internalPipelineOrchestrator.js now DOES set riskCharacteristicTags on
// every real Candidate produced by the (today, sole live) TRR reasoning branch — unconditionally,
// per §09.3's own binding decision, never gated on TRR's own riskCharacteristicDimensions:[]
// declaration. TRR zero-drift is now proven the way §13/§17/§19/§25.1 of the Sub-Spec always said
// it would be once this phase landed: golden-master OUTCOME equivalence (tests/
// wp0PhaseD6CandidateSafetyThreading.test.js), not structural non-execution — TRR's own real
// request/response corpus is acceptance-tested to independently resolve NO_KNOWN_CONFLICT for
// every domain classifyCandidateContent() ever touches, contributing zero dims tuples, exactly as
// this Sub-Spec always required.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var SafetyIntegrationPort = (typeof module !== 'undefined' && module.exports)
    ? require('./safetyIntegrationPort.js')
    : window.SafetyIntegrationPort;
  // WP0 Phase D.4 — the single source of the closed Risk Characteristic taxonomy (Phase D.1),
  // reused here for shape validation only (binding requirement 2: this Rule consumes validated
  // evidence, it does not itself decide what counts as valid vocabulary).
  var RiskCharacteristicValidator = (typeof module !== 'undefined' && module.exports)
    ? require('./riskCharacteristicValidator.js')
    : window.RiskCharacteristicValidator;

  var DISPOSITION_PRECEDENCE = SafetyIntegrationPort.DISPOSITION_PRECEDENCE;

  function freezeShallow(o) { try { return Object.freeze(o); } catch (e) { return o; } }
  // WP0 Phase D.6 — used only by finalReview()'s own modifiedContent-sourcing check below.
  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  // ── RCD-12.A — RiskType: closed 11-value enum. Engineering SHALL NOT extend. ──
  var RISK_TYPES = Object.freeze([
    'NONE', 'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_HIGH_RISK_SYMPTOM',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PSYCHOLOGICAL_DISTRESS_CONCERN', 'OUTSIDE_COACHING_SCOPE', 'INSUFFICIENT'
  ]);

  // ── RCD-12.B — EvidenceConfidence: closed 6-value enum, reusing D1 Unit 11's Evidence
  // Hierarchy unaltered. Declared strongest-to-weakest; also the tie-break rank order (RCD-14.C.3).
  var EVIDENCE_CONFIDENCE = Object.freeze([
    'EXPLICIT_USER_STATEMENT', 'EXPLICIT_USER_ACTION', 'REPEATED_BEHAVIOUR', 'SINGLE_BEHAVIOUR', 'INFERENCE', 'INSUFFICIENT'
  ]);

  // ── RCD-12.C — Correctability: closed 4-value enum. Engineering SHALL NOT extend. ──
  var CORRECTABILITY = Object.freeze(['NOT_APPLICABLE', 'BOUNDED_MODIFICATION', 'REQUIRES_INTENT_CHANGE', 'INSUFFICIENT']);

  // ── RCD-12.D — Urgency: closed 4-value enum. Engineering SHALL NOT extend. ──
  var URGENCY = Object.freeze(['ROUTINE_PROTECTIVE', 'TIME_SENSITIVE', 'IMMEDIATE_PROTECTIVE', 'INSUFFICIENT']);

  // RCD-14.C.2 tie-break rank — more time-sensitive wins; INSUFFICIENT does not represent
  // genuine urgency and ranks lowest, per RCD-12.D's own definitions (Ch.15/16 of the SPEC).
  var URGENCY_TIEBREAK_RANK = Object.freeze({ IMMEDIATE_PROTECTIVE: 3, TIME_SENSITIVE: 2, ROUTINE_PROTECTIVE: 1, INSUFFICIENT: 0 });

  // RCD-14.C.4 — the fixed, canonical, nine-item same-disposition tie-break order, independent
  // of RiskType's own enum declaration order, never a severity score. Modifiable only by a
  // future canonical Product/Architecture decision (recorded exactly as approved).
  var CANONICAL_SAFETY_RULE_ORDER = Object.freeze([
    'ACTIVE_HIGH_RISK_SYMPTOM', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'KNOWN_ALLERGY_CONFLICT',
    'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', 'DANGEROUS_OR_EXTREME_REQUEST', 'PSYCHOLOGICAL_DISTRESS_CONCERN',
    'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', 'OUTSIDE_COACHING_SCOPE'
  ]);

  // D1-AH-02's four absolute-override categories — the exact, narrower subset Stage 8's binary
  // disqualify() checks against (SPEC Ch.14), distinct from Stage 9's full five-disposition Matrix.
  var ABSOLUTE_OVERRIDE_RISK_TYPES = Object.freeze([
    'KNOWN_ALLERGY_CONFLICT', 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT', 'ACTIVE_HIGH_RISK_SYMPTOM', 'PERMANENT_SAFETY_COMMITMENT_CONFLICT'
  ]);

  // ══════════════════════════════════════════════════════════════════
  // CSR-001 (docs/specs/CSR_001_SPEC_v1.0.md §10, PD-FC-07/PD-FC-08) — deterministic text
  // matching: a private, closed-vocabulary tokenizer + exact accepted-form membership check, used
  // only by this rule. Never exported, never a reusable general Hebrew/NLP utility.
  //
  // §10 Step 1 — split-based tokenization (never a `\b`-style boundary assertion, which is
  // non-functional for Hebrew — `\b` is defined over `\w` = [A-Za-z0-9_], excluding Hebrew
  // letters entirely). PD-FC-08: Unicode letters AND Unicode numbers are token constituents;
  // every other character (whitespace, punctuation, symbols) is a delimiter — a digit directly
  // attached to a letter never creates a boundary, closing the `doctor123`/`run2026`-style
  // false-positive risk the letters-only draft carried.
  // ══════════════════════════════════════════════════════════════════
  function tokenize(text) {
    text = (typeof text === 'string') ? text : '';
    return text.split(/[^\p{L}\p{N}]+/u).filter(function (t) { return t.length > 0; });
  }

  // §10 Step 2 — PD-FC-07: the closed Hebrew accepted-form rule. For each approved Hebrew
  // vocabulary token, the accepted-form set is EXACTLY these four fixed strings, precomputed once
  // — never derived dynamically from observed input, never a general prefix-stripping rule, no
  // suffix handling, no stemming, no morphology inference.
  function hebrewAcceptedForms(token) {
    return [token, 'ה' + token, 'ו' + token, 'וה' + token];
  }

  // §8/PD-FC-04 — closed V1 medical-source vocabulary, exact, no other term authorized.
  var MEDICAL_SOURCE_ACCEPTED_FORMS = ['doctor', 'physician']
    .concat(hebrewAcceptedForms('רופא'))
    .concat(hebrewAcceptedForms('רופאה'));

  // §9/PD-FC-05 — closed V1 RUNNING-text vocabulary, exact, no other term authorized. רצה is
  // deliberately never given an accepted-form set (unvocalized homograph risk with "wanted") —
  // it and every prefixed form of it therefore can never match anything below.
  var RUNNING_TEXT_ACCEPTED_FORMS = ['run', 'running', 'jog', 'jogging']
    .concat(hebrewAcceptedForms('לרוץ'))
    .concat(hebrewAcceptedForms('ריצה'))
    .concat(hebrewAcceptedForms('ריצות'))
    .concat(hebrewAcceptedForms('רץ'));

  // §10 Step 3 — exact membership only; never "contains," never a regex, never partial/substring
  // matching. A source string matches iff at least one token produced by tokenize() is exactly
  // string-equal to a member of the given closed accepted-form set.
  function matchesAcceptedForm(text, acceptedForms) {
    var tokens = tokenize(text);
    for (var i = 0; i < tokens.length; i++) {
      if (acceptedForms.indexOf(tokens[i]) !== -1) return true;
    }
    return false;
  }

  function isQualifyingRunningRestrictionText(restrictedActivityText) {
    return typeof restrictedActivityText === 'string'
      && matchesAcceptedForm(restrictedActivityText, RUNNING_TEXT_ACCEPTED_FORMS);
  }
  function isQualifyingMedicalSourceText(statedSourceText) {
    return typeof statedSourceText === 'string'
      && matchesAcceptedForm(statedSourceText, MEDICAL_SOURCE_ACCEPTED_FORMS);
  }

  // §12 — confirmed-active dimension profile (no statedDurationText on the qualifying restriction).
  function confirmedActiveMedicalRestrictionDims() {
    return {
      riskType: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT',
      evidenceConfidence: 'EXPLICIT_USER_STATEMENT',
      correctability: 'REQUIRES_INTENT_CHANGE',
      urgency: 'ROUTINE_PROTECTIVE'
    };
  }
  // §13 — temporally-unresolved dimension profile (a statedDurationText is present, any form; no
  // date arithmetic is ever performed to interpret it — presence alone is the only signal used).
  function temporallyUnresolvedMedicalRestrictionDims() {
    return {
      riskType: 'ACTIVE_MEDICAL_INSTRUCTION_CONFLICT',
      evidenceConfidence: 'INSUFFICIENT',
      correctability: 'REQUIRES_INTENT_CHANGE',
      urgency: 'ROUTINE_PROTECTIVE'
    };
  }

  // §7/§14/§16 — CSR-001's one V1 Canonical Safety Rule: explicit user-reported medical RUNNING
  // restriction × a RUNNING Candidate. Runs only against a real `candidate` (the Stage-8 call
  // path) — the caller (matchCanonicalSafetyRules below) never invokes this with a null candidate.
  function matchRunningMedicalRestrictionRule(candidate, pipelineContext) {
    // §14 NO-MATCH — precondition: a RUNNING Candidate, structurally, never textually.
    if (!candidate || !candidate.actionIdentity || candidate.actionIdentity.activity !== 'RUNNING') {
      return [];
    }
    var userSafetyContext = pipelineContext && pipelineContext.userSafetyContext;
    var userSafetyProvenance = pipelineContext && pipelineContext.userSafetyProvenance;
    // §14 NO-MATCH — precondition: both canonical inputs must exist with real items to consider.
    if (!userSafetyContext || !Array.isArray(userSafetyContext.items) || userSafetyContext.items.length === 0) {
      return [];
    }
    if (!userSafetyProvenance || !Array.isArray(userSafetyProvenance.items) || userSafetyProvenance.items.length === 0) {
      return [];
    }

    // §7 — sourceMemoryId-keyed lookup, built once per call; never positional.
    var provenanceBySourceMemoryId = {};
    userSafetyProvenance.items.forEach(function (item) {
      if (item && typeof item.sourceMemoryId === 'string') {
        provenanceBySourceMemoryId[item.sourceMemoryId] = item;
      }
    });

    var matchedDims = [];
    userSafetyContext.items.forEach(function (restriction) {
      if (!restriction || typeof restriction.sourceMemoryId !== 'string') return;
      // §9 — the restriction's own literal text must denote RUNNING.
      if (!isQualifyingRunningRestrictionText(restriction.restrictedActivityText)) return;
      // §7/§14 — the SAME sourceMemoryId's provenance item must exist; never merged across records.
      var provenance = provenanceBySourceMemoryId[restriction.sourceMemoryId];
      if (!provenance) return;
      // §8 — the joined provenance's own literal text must denote a medical source.
      if (!isQualifyingMedicalSourceText(provenance.statedSourceText)) return;
      // §11 — temporal state: presence of statedDurationText alone selects the profile; no parsing.
      var hasStatedDuration = restriction.statedDurationText != null;
      matchedDims.push(hasStatedDuration
        ? temporallyUnresolvedMedicalRestrictionDims()
        : confirmedActiveMedicalRestrictionDims());
    });
    return matchedDims;
  }

  // ══════════════════════════════════════════════════════════════════
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §27, TDP Ch.10(b)) — WALKING Canonical Safety Rule.
  // Reuses RUNNING's own dimension profile verbatim (ratified in principle, TDP Ch.10(b)) —
  // ACTIVE_MEDICAL_INSTRUCTION_CONFLICT is a closed, activity-agnostic RiskType member, not
  // RUNNING-specific; confirmedActiveMedicalRestrictionDims()/temporallyUnresolvedMedicalRestrictionDims()
  // are reused unchanged, no new dimension function.
  //
  // Foundation boundary (TRR_001_SPEC_v1.0.md §27) — inherited CSR-001 limitation, not repaired
  // here: this Rule, like matchRunningMedicalRestrictionRule() above, recognizes a restriction for
  // its own activity only through its own narrow, literal accepted-form predicate. A restriction
  // genuinely about WALKING but phrased outside that predicate produces no match and resolves
  // UNMODIFIED — not because non-relevance was proven, but because the predicate did not match.
  // This is CSR-001's own accepted, disclosed, intentional design tradeoff (no fuzzy matching, no
  // synonym inference), explicitly cited by TDP Ch.10(c) as the model to mirror, not a defect this
  // Work Item repairs.
  // ══════════════════════════════════════════════════════════════════

  // §27 — closed V1 WALKING-text vocabulary, exact, no other term authorized. The Hebrew
  // present-participle forms (הולך/הולכת, "going/walking") are deliberately excluded — homograph
  // risk with the general verb "to go," mirroring RUNNING's own deliberate exclusion of רצה
  // (homograph risk with "wanted"). LINGUISTIC VERIFICATION REQUIRED before merge — flagged, non-
  // blocking (TRR_001_SPEC_v1.0.md §46).
  var WALKING_TEXT_ACCEPTED_FORMS = ['walk', 'walking']
    .concat(hebrewAcceptedForms('ללכת'))
    .concat(hebrewAcceptedForms('הליכה'))
    .concat(hebrewAcceptedForms('הליכות'));

  function isQualifyingWalkingRestrictionText(restrictedActivityText) {
    return typeof restrictedActivityText === 'string'
      && matchesAcceptedForm(restrictedActivityText, WALKING_TEXT_ACCEPTED_FORMS);
  }

  function matchWalkingMedicalRestrictionRule(candidate, pipelineContext) {
    if (!candidate || !candidate.actionIdentity || candidate.actionIdentity.activity !== 'WALKING') {
      return [];
    }
    var userSafetyContext = pipelineContext && pipelineContext.userSafetyContext;
    var userSafetyProvenance = pipelineContext && pipelineContext.userSafetyProvenance;
    if (!userSafetyContext || !Array.isArray(userSafetyContext.items) || userSafetyContext.items.length === 0) {
      return [];
    }
    if (!userSafetyProvenance || !Array.isArray(userSafetyProvenance.items) || userSafetyProvenance.items.length === 0) {
      return [];
    }

    var provenanceBySourceMemoryId = {};
    userSafetyProvenance.items.forEach(function (item) {
      if (item && typeof item.sourceMemoryId === 'string') {
        provenanceBySourceMemoryId[item.sourceMemoryId] = item;
      }
    });

    var matchedDims = [];
    userSafetyContext.items.forEach(function (restriction) {
      if (!restriction || typeof restriction.sourceMemoryId !== 'string') return;
      if (!isQualifyingWalkingRestrictionText(restriction.restrictedActivityText)) return;
      var provenance = provenanceBySourceMemoryId[restriction.sourceMemoryId];
      if (!provenance) return;
      if (!isQualifyingMedicalSourceText(provenance.statedSourceText)) return;
      var hasStatedDuration = restriction.statedDurationText != null;
      matchedDims.push(hasStatedDuration
        ? temporallyUnresolvedMedicalRestrictionDims()
        : confirmedActiveMedicalRestrictionDims());
    });
    return matchedDims;
  }

  // ══════════════════════════════════════════════════════════════════
  // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §28, TDP Ch.10(c)) — the Unresolved Activity Safety
  // Coverage Rule. Approved Product/Architecture mechanism (Option D / refined Option A): applies
  // to every PHYSICAL_ACTIVITY proposal outside RUNNING/WALKING's own dedicated coverage.
  //
  // Two-part mechanism, reusing only RUNNING_TEXT_ACCEPTED_FORMS/WALKING_TEXT_ACCEPTED_FORMS — no
  // new table, no new per-sport Rule, no restriction-scope classification, no AI-owned judgment:
  // (1) known, different, closed-vocabulary MAI-001 identity — MAI-001's own mutual exclusivity is
  // itself the deterministic proof of difference; (2) open/unnormalized identity — failed
  // deterministic normalization is NOT treated as proof of difference; the candidate's own
  // activityReference is additionally checked against the same accepted-form vocabulary the
  // restriction matched, so a candidate whose own words also match remains conservative
  // (unresolved) rather than clearing on an unproven assumption of difference. TDP's own named
  // Pilates-clears-against-RUNNING-restriction example remains authoritative for TRR V1.
  //
  // Documented canonical limitation (TRR_001_SPEC_v1.0.md §28) — TRR V1 does not possess, and does
  // not claim to possess, a general deterministic Candidate<->restriction semantic-relevance
  // engine. Failed normalization is not, in general, proof of semantic difference; accepted-form
  // non-match is not, in general, proof of semantic difference; this mechanism is never a
  // universal Safety-compatibility solution. The residual epistemic gap (an activity described in
  // words outside the closed accepted-form lists, on either side, cannot be proven identical or
  // different to another such activity) is inherited and accepted for V1, by explicit
  // Product/Architecture ruling, not silently assumed away.
  // ══════════════════════════════════════════════════════════════════

  // The "Rule-covered" activities: every MAI-001 token with its own dedicated Canonical Safety
  // Rule above. This Rule explicitly SKIPS them — their own dedicated Rule is the sole authority
  // for their own activity, including that Rule's own accepted no-match behavior (Foundation
  // Boundary above — not repaired, not reinterpreted, here).
  var RULE_COVERED_ACTIVITIES = Object.freeze(['RUNNING', 'WALKING']);

  // A restriction's own literal text is "elsewhere-identified" when it is already Rule-qualified,
  // via the SAME accepted-form vocabularies above (no new vocabulary, no new per-sport table) —
  // never a generalized synonym/non-overlap inference, and never applied to any activity outside
  // those two closed lists.
  function restrictionIsElsewhereIdentified(restrictedActivityText) {
    return isQualifyingRunningRestrictionText(restrictedActivityText)
      || isQualifyingWalkingRestrictionText(restrictedActivityText);
  }

  // Refined Option A (Product/Architecture ruling) — applied ONLY when the candidate carries no
  // known actionIdentity. Checks the candidate's OWN activityReference against the SAME
  // already-authorized vocabulary a restriction was elsewhere-identified against, reusing
  // matchesAcceptedForm() — the identical function, applied to one more already-existing field, no
  // new vocabulary. This does not prove semantic difference in the general case (documented
  // limitation above); it closes the one concrete literal failure mode where the model's own words
  // for the proposed activity happen to literally match the same closed vocabulary the restriction
  // matched, preventing failed normalization from masquerading as proof of non-relevance.
  function candidateOwnReferenceMatchesElsewhereVocabulary(activityReference) {
    return typeof activityReference === 'string'
      && (matchesAcceptedForm(activityReference, RUNNING_TEXT_ACCEPTED_FORMS)
        || matchesAcceptedForm(activityReference, WALKING_TEXT_ACCEPTED_FORMS));
  }

  function matchUnresolvedActivitySafetyCoverageRule(candidate, pipelineContext) {
    // Applies only to PHYSICAL_ACTIVITY proposals — never NON_ACTIVITY_COACHING_ACTION or any
    // Candidate kind this vertical does not itself produce (both undefined for every other kind).
    if (!candidate || candidate.actionCategory !== 'PHYSICAL_ACTIVITY') return [];
    var activity = candidate.actionIdentity && candidate.actionIdentity.activity;
    if (activity && RULE_COVERED_ACTIVITIES.indexOf(activity) !== -1) return []; // own dedicated Rule governs

    var userSafetyContext = pipelineContext && pipelineContext.userSafetyContext;
    var items = (userSafetyContext && Array.isArray(userSafetyContext.items)) ? userSafetyContext.items : [];

    // Outcome 2 — clear deterministic no-relevant-restriction: EITHER no restriction is on record
    // at all (TDP's own "at minimum" case), OR every restriction on record resolves non-relevant
    // to THIS SPECIFIC candidate, per the two-part mechanism above.
    var everyRestrictionIsNonRelevantToThisCandidate = items.length === 0 || items.every(function (r) {
      if (!r || !restrictionIsElsewhereIdentified(r.restrictedActivityText)) return false; // not identified at all -> unresolved (outcome 3)

      if (activity) {
        // Mechanism (1) — known, different, closed-vocabulary MAI-001 identity. MAI-001's own
        // mutual exclusivity is itself the deterministic proof of difference.
        return true;
      }

      // Mechanism (2) — open/unnormalized candidate. Failed normalization is NOT proof of
      // difference; check the candidate's own text against the same vocabulary before concluding
      // non-relevance. If it too matches, remain conservative (unresolved) rather than clear.
      return !candidateOwnReferenceMatchesElsewhereVocabulary(candidate.activityReference);
    });

    if (everyRestrictionIsNonRelevantToThisCandidate) return [];

    // Outcome 3 — at least one restriction on record could not be resolved non-relevant to this
    // candidate by either mechanism above. The honest default (TDP Ch.10(c)). Never outcome 1:
    // this generic Rule owns no per-activity literal vocabulary of its own, so it can never itself
    // assert a clear conflict — only the two per-activity Rules above can.
    // riskType/evidenceConfidence/correctability/urgency all INSUFFICIENT — the closed, existing
    // combination evaluateRulePredicate() already maps unconditionally to DEFERRED, with
    // reasonCodeForRule() already mapping it to the existing 'INSUFFICIENT_SAFETY_CONTEXT'
    // reasonCode — no new enum value, no new reasonCode, reusing SL-001's own closed DEFERRED
    // semantics verbatim.
    return [{
      riskType: 'INSUFFICIENT', evidenceConfidence: 'INSUFFICIENT',
      correctability: 'INSUFFICIENT', urgency: 'INSUFFICIENT'
    }];
  }

  // ══════════════════════════════════════════════════════════════════
  // WP0 Phase D.4 — matchGovernedRiskCharacteristicRule(), §12/§13/§14 of the Sub-Spec. See the
  // file header for the full disclosure (unconditional execution, TRR zero-drift-by-construction,
  // zero new enums).
  // ══════════════════════════════════════════════════════════════════

  // §12 — evidenceSource='AI_CANDIDATE_CHARACTERIZATION' always maps to evidenceConfidence=
  // 'INFERENCE', never 'EXPLICIT_USER_STATEMENT' — the one general rule the mapping table states
  // once, applied uniformly regardless of domain. Both 'CURRENT_TURN_USER_STATEMENT' and
  // 'DURABLE_GOVERNED_USER_FACT' are user-stated evidence (§08.4) and map to EXPLICIT_USER_STATEMENT.
  function evidenceConfidenceForTag(tag) {
    return (tag && tag.evidenceSource === 'AI_CANDIDATE_CHARACTERIZATION') ? 'INFERENCE' : 'EXPLICIT_USER_STATEMENT';
  }

  // §11/§12 — the conservative, uniform "cannot confidently determine" dims tuple: riskType/
  // evidenceConfidence/correctability/urgency all INSUFFICIENT (unless the sole issue is
  // low-confidence AI characterization, in which case evidenceConfidence is INFERENCE — §12's own
  // stated exception) — the existing, unmodified evaluateRulePredicate() branch 3 maps this
  // unconditionally to DEFERRED, never UNMODIFIED (binding requirement 4: unknown/malformed/
  // unresolved characterization must never collapse to "safe").
  function governedRiskCharacteristicInsufficientDims(tag) {
    var ec = (tag && tag.evidenceSource === 'AI_CANDIDATE_CHARACTERIZATION') ? 'INFERENCE' : 'INSUFFICIENT';
    return { riskType: 'INSUFFICIENT', evidenceConfidence: ec, correctability: 'INSUFFICIENT', urgency: 'INSUFFICIENT' };
  }

  // §14 MODIFIED content-sourcing gate (binding requirement 7).
  //
  // AUTHORITY CORRECTION (Phase D.4, preserved unchanged): the bare PRESENCE of
  // candidate.safeAlternative is NEVER sufficient to select BOUNDED_MODIFICATION — a
  // model-proposed safeAlternative is non-authoritative AI output; its mere existence must never
  // make Safety consider a candidate "safely modifiable." This function still never reads
  // candidate.safeAlternative's own content, and never invents or trusts any self-asserted
  // "verified"/"safe"/similar flag a proposing capability could set on its own output — that would
  // only relocate the same self-certification problem (Phase D.4's own header, preserved above in
  // spirit).
  //
  // WP0 Phase D.6 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §14/§16, Product+
  // Architecture APPROVED) — implements the design note this function's D.4 version left open.
  // candidate.safeAlternativeCharacterization is the governed, independently-DERIVED evidence
  // this gate consults: an array of RiskCharacteristicTag-shaped entries, produced ONLY by
  // internalPipelineOrchestrator.js's own characterizeActionTextForSafety() (the SAME
  // classifyCandidateContent() + RiskCharacteristicValidator pipeline this file already reuses for
  // the Candidate's own riskCharacteristicTags) — never settable by the proposing capability
  // itself (structurally verified: safeAlternativeCharacterization never appears anywhere in
  // generalReasoningCapability.js or any reasoning capability's own output-construction code).
  //
  // BOUNDED_MODIFICATION is selected only when that independently-derived evidence contains a
  // shape-valid entry for the SAME `domain` as the tag currently being mapped, with
  // `relation === 'NO_KNOWN_CONFLICT'` — i.e. the alternative's own content was independently
  // re-characterized and found to touch that domain with no known conflict. Absent evidence
  // (safeAlternativeCharacterization is null/not an array — no safeAlternative was ever proposed,
  // or this Candidate predates Phase D.6's own wiring), a still-conflicting characterization for
  // that domain, or a malformed/failure-sentinel entry (which never validates as shape-valid) all
  // fall through to the same conservative REQUIRES_INTENT_CHANGE default — never a fabricated
  // clearance (binding requirement 6).
  function governedCorrectabilityWithSafeAlternativeGate(candidate, domain) {
    var altTags = (candidate && Array.isArray(candidate.safeAlternativeCharacterization))
      ? candidate.safeAlternativeCharacterization : null;
    if (!altTags) return 'REQUIRES_INTENT_CHANGE';
    var cleared = altTags.some(function (t) {
      return RiskCharacteristicValidator && RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(t)
        && t.domain === domain && t.relation === 'NO_KNOWN_CONFLICT';
    });
    return cleared ? 'BOUNDED_MODIFICATION' : 'REQUIRES_INTENT_CHANGE';
  }

  // §12 — the approved mapping table, reused verbatim. Every branch targets an existing, closed
  // RiskType member (RISK_TYPES above) — no new enum value anywhere. A domain/severity/relation
  // combination the approved table does not explicitly populate (§08's own "most combinations are
  // never populated in practice — the mapping table is the actual governing artifact") is never
  // silently invented here; it falls through to the same conservative INSUFFICIENT/DEFERRED
  // default as UNRESOLVED_RELEVANCE (binding requirement 4).
  //
  // Engineering resolution of one genuine taxonomy ambiguity, disclosed: the approved table
  // distinguishes a PHYSICAL_EXERTION_OR_MOVEMENT/PROHIBITIVE/DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT
  // durable conflict that is "explicitly medical-instruction-shaped" (-> ACTIVE_MEDICAL_INSTRUCTION_
  // CONFLICT, an ABSOLUTE_OVERRIDE_RISK_TYPE) from one that is not (-> SIGNIFICANT_INJURY_OR_
  // RECOVERY_CONFLICT). The closed RiskCharacteristicTag shape (§08) carries no field capturing
  // "medical-instruction-shaped" — that determination is owned exclusively by
  // matchRunningMedicalRestrictionRule/matchWalkingMedicalRestrictionRule's own userSafetyProvenance
  // join (a stated medical SOURCE — "doctor"/"physician" — this Rule has no access to at all).
  // This Rule therefore never produces ACTIVE_MEDICAL_INSTRUCTION_CONFLICT — only the broader,
  // non-absolute-override SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT — for this row; the narrower,
  // stronger RiskType remains exclusively reachable through the existing, provenance-joined Rules.
  function mapGovernedRiskCharacteristicTagToDims(tag, candidate) {
    var domain = tag.domain, severity = tag.severity, relation = tag.relation;
    var ec = evidenceConfidenceForTag(tag);

    // §11/§12 — checked first, before any row match, so it can never accidentally satisfy a row
    // that does not itself constrain `relation`.
    if (relation === 'UNRESOLVED_RELEVANCE') return governedRiskCharacteristicInsufficientDims(tag);

    // WP0 Phase D.6.1 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md, D.6.1 canonical
    // addition, Product+Architecture APPROVED) — checked second, immediately after the
    // UNRESOLVED_RELEVANCE short-circuit and before any per-domain row, for the identical reason:
    // it must never accidentally satisfy a row that does not itself constrain `severity`. Binding
    // canonical decision: "RELATION AUTHORITY != SEVERITY AUTHORITY" — a relation can be
    // authoritatively DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT (internalPipelineOrchestrator.js's
    // own resolveDurableFactRelation(), via the independent, bounded
    // classifyCandidateConflictWithFact() classifier) while severity remains genuinely unknown to
    // any closed-taxonomy or deterministic mechanism (D.6.1's own read-only investigation found no
    // sufficient authority to derive severity from RiskDomain alone — a food intolerance and a
    // life-threatening allergy can share one domain — and restoring AI-proposed severity as
    // authority was explicitly rejected). `evidenceConfidence` is preserved HONESTLY via the same,
    // unmodified evidenceConfidenceForTag() every other row uses — the RELATION itself is
    // well-evidenced (EXPLICIT_USER_STATEMENT tier for a DURABLE_GOVERNED_USER_FACT-sourced tag);
    // only `correctability`/`urgency`/`riskType` are conservatively INSUFFICIENT, which is what
    // forces evaluateRulePredicate()'s own unmodified branch 3 to DEFERRED — reusing the existing,
    // approved INSUFFICIENT/DEFERRED/INSUFFICIENT_SAFETY_CONTEXT path verbatim, never a new
    // disposition or reasonCode. governedCorrectabilityWithSafeAlternativeGate() is deliberately
    // NEVER invoked here: correctability is fixed to INSUFFICIENT directly, so MODIFIED is
    // structurally unreachable regardless of any safeAlternative — a cleared alternative cannot
    // override an unresolved primary severity (LIFE_CRITICAL-tier severity, if it turned out to be
    // the true, unknown value, must never be silently modified rather than absolutely blocked; see
    // §14's own LIFE_CRITICAL definition). BLOCKED is equally unreachable (correctability isn't
    // REQUIRES_INTENT_CHANGE either) — nothing is fabricated in either direction.
    if (relation === 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' && severity === 'NOT_ESTABLISHED') {
      return { riskType: 'INSUFFICIENT', evidenceConfidence: ec, correctability: 'INSUFFICIENT', urgency: 'INSUFFICIENT', domain: domain };
    }

    if (domain === 'PHYSICAL_EXERTION_OR_MOVEMENT' && severity === 'LIFE_CRITICAL' && relation === 'ACUTE_STATE_INDICATED_THIS_TURN') {
      return { riskType: 'ACTIVE_HIGH_RISK_SYMPTOM', evidenceConfidence: ec, correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'IMMEDIATE_PROTECTIVE' };
    }
    if (domain === 'PHYSICAL_EXERTION_OR_MOVEMENT' && severity === 'PROHIBITIVE' && relation === 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT') {
      return { riskType: 'SIGNIFICANT_INJURY_OR_RECOVERY_CONFLICT', evidenceConfidence: ec, correctability: governedCorrectabilityWithSafeAlternativeGate(candidate, domain), urgency: 'ROUTINE_PROTECTIVE', domain: domain };
    }
    if (domain === 'INGESTION_OR_SUBSTANCE_EXPOSURE' && (severity === 'LIFE_CRITICAL' || severity === 'PROHIBITIVE') && relation === 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT') {
      return { riskType: 'KNOWN_ALLERGY_CONFLICT', evidenceConfidence: ec, correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE' };
    }
    if (domain === 'EATING_PATTERN_OR_BODY_IMAGE' && (severity === 'PROHIBITIVE' || severity === 'ADVISORY')
      && (relation === 'DIRECT_CONFLICT_WITH_DURABLE_CONSTRAINT' || relation === 'ACUTE_STATE_INDICATED_THIS_TURN')) {
      return { riskType: 'DISORDERED_EATING_OR_BODY_IMAGE_CONCERN', evidenceConfidence: ec, correctability: governedCorrectabilityWithSafeAlternativeGate(candidate, domain), urgency: 'ROUTINE_PROTECTIVE', domain: domain };
    }
    if (domain === 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE' && severity === 'REQUIRES_PROFESSIONAL_JUDGMENT' && relation === 'ACUTE_STATE_INDICATED_THIS_TURN') {
      return {
        riskType: 'PSYCHOLOGICAL_DISTRESS_CONCERN', evidenceConfidence: ec, correctability: 'NOT_APPLICABLE',
        urgency: 'IMMEDIATE_PROTECTIVE', immediateProtectiveOrProfessionalSupportRequired: true
      };
    }
    if (domain === 'PSYCHOLOGICAL_OR_EMOTIONAL_STATE' && severity === 'ADVISORY') {
      // The approved §12 table phrases this row's correctability as an unconditional
      // BOUNDED_MODIFICATION (no explicit "or REQUIRES_INTENT_CHANGE" alternative given, unlike
      // the other BOUNDED_MODIFICATION-eligible rows). Product/Architecture's own authority
      // correction (this round) applies uniformly, not only to rows originally phrased with an
      // explicit "or": MODIFIED content has to come from somewhere, and safeAlternative is the
      // only content-sourcing mechanism §14 ever names — so this row is equally subject to the
      // same independent-verification requirement, routed through the same gate as every other
      // BOUNDED_MODIFICATION-eligible row.
      return { riskType: 'PSYCHOLOGICAL_DISTRESS_CONCERN', evidenceConfidence: ec, correctability: governedCorrectabilityWithSafeAlternativeGate(candidate, domain), urgency: 'ROUTINE_PROTECTIVE', domain: domain };
    }
    if (domain === 'STANDING_OR_IRREVERSIBLE_COMMITMENT' && severity === 'LIFE_CRITICAL') {
      return { riskType: 'PERMANENT_SAFETY_COMMITMENT_CONFLICT', evidenceConfidence: ec, correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE' };
    }
    if (domain === 'MEDICAL_OR_CLINICAL_JUDGMENT_REQUIRED' && severity === 'REQUIRES_PROFESSIONAL_JUDGMENT') {
      return {
        riskType: 'OUTSIDE_COACHING_SCOPE', evidenceConfidence: ec, correctability: 'NOT_APPLICABLE',
        urgency: 'ROUTINE_PROTECTIVE', outsideCoachingAuthorityRequiringProfessionalSupport: true
      };
    }
    if (domain === 'EXTREME_OR_UNBOUNDED_INTENSITY' && (severity === 'PROHIBITIVE' || severity === 'LIFE_CRITICAL')) {
      // §12.1 — no universal deterministic threshold exists; the EvidenceSource->EvidenceConfidence
      // mapping above already, unconditionally, sends an AI-characterized instance to INFERENCE,
      // which evaluateRulePredicate()'s own existing branch 3 catches before BLOCKED can ever be
      // reached from inference-confidence evidence alone — reusing the existing precedence
      // unmodified, no special-case branch required here.
      return { riskType: 'DANGEROUS_OR_EXTREME_REQUEST', evidenceConfidence: ec, correctability: 'REQUIRES_INTENT_CHANGE', urgency: 'ROUTINE_PROTECTIVE' };
    }

    // Not one of the approved, explicitly-populated §12 rows — the honest, conservative default,
    // never silently cleared (binding requirement 4).
    return governedRiskCharacteristicInsufficientDims(tag);
  }

  // §13 — matchGovernedRiskCharacteristicRule(candidate, pipelineContext): the exact 2-argument
  // signature every Canonical Safety Rule function actually receives from
  // matchCanonicalSafetyRules() below (`rule(candidate, pipelineContext)`) — pipelineContext is
  // accepted for structural consistency with every sibling Rule but not read (this Rule's only
  // input is the Candidate's own already-validated riskCharacteristicTags, per §13's own "Reads
  // candidate.riskCharacteristicTags — the independently re-derived and validated tags").
  //
  // Reads candidate.riskCharacteristicTags (binding requirement 2 — consumes validated evidence
  // only; the AI interpreter/classifier itself is never Safety authority): each tag is
  // independently re-verified for closed-vocabulary shape here (never trusted merely because it is
  // present on the Candidate) using the same RiskCharacteristicValidator every earlier Phase
  // already uses — a malformed entry actually present in the array is never silently dropped
  // (binding requirement 4); it reports INSUFFICIENT for that tag instead. For each valid tag with
  // relation !== 'NO_KNOWN_CONFLICT', applies the §12 mapping table deterministically (pure lookup,
  // no further AI call) to produce a dims-tuple, concatenated exactly as the existing Rules already
  // do — this function's return shape is byte-identical to every sibling Rule's own return
  // contract, consumed by the same, unmodified evaluateCanonicalSafetyRules()/
  // selectWinningDisposition()/selectPrimaryAndSecondary() machinery.
  function matchGovernedRiskCharacteristicRule(candidate, pipelineContext) {
    var tags = (candidate && Array.isArray(candidate.riskCharacteristicTags)) ? candidate.riskCharacteristicTags : [];
    var matchedDims = [];
    tags.forEach(function (tag) {
      if (!RiskCharacteristicValidator || !RiskCharacteristicValidator.isValidRiskCharacteristicTagShape(tag)) {
        matchedDims.push(governedRiskCharacteristicInsufficientDims(tag));
        return;
      }
      if (tag.relation === 'NO_KNOWN_CONFLICT') return; // no dims tuple produced — the honest, common case (§12)
      matchedDims.push(mapGovernedRiskCharacteristicTagToDims(tag, candidate));
    });
    return matchedDims;
  }

  // §16 — the internal, explicit list of Canonical Safety Rules. TRR-001 adds two additive
  // entries, WP0 Phase D.4 adds one more, ordered specific-to-general (no behavioral effect from
  // ordering, since each Rule's own precondition is disjoint, but kept readable) — no dynamic
  // loading, no external rule-content file, no registry.
  var CANONICAL_SAFETY_RULES = [
    matchRunningMedicalRestrictionRule,
    matchWalkingMedicalRestrictionRule,
    matchUnresolvedActivitySafetyCoverageRule,
    matchGovernedRiskCharacteristicRule
  ];

  // ══════════════════════════════════════════════════════════════════
  // Canonical Safety Rule matching (RCD-12.A derivation input; RCD-14 runtime unit) — see file
  // header and CSR-001 SPEC §16. `candidate`/`terminalDecision` are accepted for structural
  // correctness (Stage 8 supplies a Candidate; Stage 9 supplies the pre-review Terminal Decision
  // plus, per the Stage-9 Winning-Candidate Safety Input Canonical Decision, the real winning
  // Candidate for a SINGLE_WINNER Terminal Decision only; Stage 3 supplies neither).
  // ══════════════════════════════════════════════════════════════════
  function matchCanonicalSafetyRules(candidate, terminalDecision, pipelineContext) {
    // §16/§18 — returns [] unconditionally whenever no candidate is supplied: the TIED_SET Stage-9
    // call path (explicitly out of scope for the Stage-9 Winning-Candidate Safety Input Canonical
    // Decision — no tied-member is treated as a stand-in winner for Safety purposes) and any direct
    // call omitting the argument. Never attempts to recover actionIdentity from terminalDecision
    // (including any TIED_SET options[] exposure) — Stage 8, and now Stage 9's SINGLE_WINNER path,
    // are the only guaranteed consumption points for actionIdentity.
    if (!candidate) return [];
    var results = [];
    CANONICAL_SAFETY_RULES.forEach(function (rule) {
      results = results.concat(rule(candidate, pipelineContext));
    });
    return results;
  }

  // ── SPEC Ch.9/10, Ch.14 Stage 3 — safety-triggered Opportunity detection contribution.
  // Mirrors initiativeEngine.js's detectDisruptionOpportunities/detectMilestoneRecoveryOpportunities
  // precedent exactly: a real, correctly-typed detection function that correctly yields zero
  // Opportunities given the current absence of a Health/Safety Profile data source in Pipeline
  // Context (same Repository Gap as matchCanonicalSafetyRules above). Not reachable via the
  // existing SafetyIntegrationPort (which defines only disqualify()/finalReview(), T006 §21.8);
  // exposed here, and dispatched from internalPipelineOrchestrator.js, for a future Stage 3/4
  // caller or tests — structurally parallel to detectInitiativeOpportunities().
  function detectSafetyOpportunities(pipelineContext) {
    pipelineContext = pipelineContext || {};
    return [];
  }

  // ── RCD-12.E — per-Rule ordered disposition predicates, evaluated in the fixed protective
  // order. `dims`: { riskType, evidenceConfidence, correctability, urgency, escalationRequired?,
  // immediateProtectiveOrProfessionalSupportRequired?, outsideCoachingAuthorityRequiringProfessionalSupport? }
  // — the three optional booleans carry the ESCALATED predicate's non-dimension-derived
  // conditions (constitutionally-required professional support signals); they default to false
  // and are never set true by matchCanonicalSafetyRules at this baseline (same Repository Gap).
  function evaluateRulePredicate(dims) {
    dims = dims || {};

    // 1. ESCALATED
    if (dims.escalationRequired === true) return 'ESCALATED';
    if (dims.riskType === 'ACTIVE_HIGH_RISK_SYMPTOM' && dims.urgency === 'IMMEDIATE_PROTECTIVE') return 'ESCALATED';
    if (dims.riskType === 'PSYCHOLOGICAL_DISTRESS_CONCERN' && dims.immediateProtectiveOrProfessionalSupportRequired === true) return 'ESCALATED';
    if (dims.outsideCoachingAuthorityRequiringProfessionalSupport === true) return 'ESCALATED';

    // 2. BLOCKED
    if (dims.riskType !== 'NONE' && dims.riskType !== 'INSUFFICIENT'
      && dims.evidenceConfidence !== 'INFERENCE' && dims.evidenceConfidence !== 'INSUFFICIENT'
      && dims.correctability === 'REQUIRES_INTENT_CHANGE') return 'BLOCKED';

    // 3. DEFERRED
    if (dims.riskType === 'INSUFFICIENT' || dims.evidenceConfidence === 'INFERENCE' || dims.evidenceConfidence === 'INSUFFICIENT'
      || dims.correctability === 'INSUFFICIENT' || dims.urgency === 'INSUFFICIENT') return 'DEFERRED';

    // 4. MODIFIED
    if (dims.riskType !== 'NONE' && dims.riskType !== 'INSUFFICIENT'
      && dims.evidenceConfidence !== 'INFERENCE' && dims.evidenceConfidence !== 'INSUFFICIENT'
      && dims.correctability === 'BOUNDED_MODIFICATION') return 'MODIFIED';

    // 5. UNMODIFIED
    return 'UNMODIFIED';
  }

  // RCD-12.E fixed reasonCode mappings + RCD-14.E preserved special mappings: UNMODIFIED ->
  // NO_SAFETY_CONFLICT; ESCALATED -> PROFESSIONAL_SUPPORT_REQUIRED; DEFERRED -> INFERRED_SIGNAL_
  // NOT_SUFFICIENT (evidenceConfidence === INFERENCE) or INSUFFICIENT_SAFETY_CONTEXT (otherwise);
  // BLOCKED/MODIFIED -> the matched RiskType's own literal (RCD-12.A and RCD-13.A/RCD-11 share
  // nine identical literal values by construction, not by this function's own invention).
  function reasonCodeForRule(dims, disposition) {
    if (disposition === 'UNMODIFIED') return 'NO_SAFETY_CONFLICT';
    if (disposition === 'ESCALATED') return 'PROFESSIONAL_SUPPORT_REQUIRED';
    if (disposition === 'DEFERRED') {
      return dims.evidenceConfidence === 'INFERENCE' ? 'INFERRED_SIGNAL_NOT_SUFFICIENT' : 'INSUFFICIENT_SAFETY_CONTEXT';
    }
    return dims.riskType; // BLOCKED / MODIFIED
  }

  // RCD-14.B — cross-Rule disposition precedence: the winning disposition is the first, in
  // ESCALATED -> BLOCKED -> DEFERRED -> MODIFIED -> UNMODIFIED order, actually produced by any
  // per-Rule Candidate Disposition.
  function selectWinningDisposition(ruleResults) {
    for (var i = 0; i < DISPOSITION_PRECEDENCE.length; i++) {
      var d = DISPOSITION_PRECEDENCE[i];
      for (var j = 0; j < ruleResults.length; j++) {
        if (ruleResults[j].disposition === d) return d;
      }
    }
    return 'UNMODIFIED';
  }

  function evidenceRank(ec) {
    var idx = EVIDENCE_CONFIDENCE.indexOf(ec);
    return idx === -1 ? -1 : (EVIDENCE_CONFIDENCE.length - 1 - idx);
  }
  function urgencyRank(u) {
    return (u in URGENCY_TIEBREAK_RANK) ? URGENCY_TIEBREAK_RANK[u] : -1;
  }
  function ruleOrderRank(riskType) {
    var idx = CANONICAL_SAFETY_RULE_ORDER.indexOf(riskType);
    return idx === -1 ? CANONICAL_SAFETY_RULE_ORDER.length : idx;
  }

  // RCD-14.C — the deterministic same-disposition tie-break, in exact order: (1) disposition
  // precedence is already applied by the caller (filteredResults all share one disposition); (2)
  // Urgency, more time-sensitive wins; (3) EvidenceConfidence, higher D1 Evidence Hierarchy tier
  // wins; (4) Canonical Safety Rule Order, lower (higher-precedence) index wins. The surviving
  // first element is the Primary Rule Result. RCD-13.F forbids duplicate/primary-equal codes
  // inside secondaryReasonCodes; deduplicating against the primary's own code here is a direct,
  // uniform application of that rule — it also correctly empties secondaryReasonCodes whenever
  // every matched Rule collapses to the same reasonCode (e.g. ESCALATED's fixed RCD-14.E mapping
  // to PROFESSIONAL_SUPPORT_REQUIRED, or DEFERRED's two fixed codes), without a disposition-
  // specific special case.
  function selectPrimaryAndSecondary(filteredResults) {
    if (!filteredResults || filteredResults.length === 0) return { primary: null, secondaryCodes: [] };
    var sorted = filteredResults.slice().sort(function (a, b) {
      var ur = urgencyRank(b.urgency) - urgencyRank(a.urgency);
      if (ur !== 0) return ur;
      var er = evidenceRank(b.evidenceConfidence) - evidenceRank(a.evidenceConfidence);
      if (er !== 0) return er;
      return ruleOrderRank(a.riskType) - ruleOrderRank(b.riskType);
    });
    var primary = sorted[0];
    var seen = {};
    seen[primary.reasonCode] = true;
    var secondaryCodes = [];
    for (var i = 1; i < sorted.length; i++) {
      var code = sorted[i].reasonCode;
      if (!seen[code]) {
        seen[code] = true;
        secondaryCodes.push(code);
      }
    }
    return { primary: primary, secondaryCodes: secondaryCodes };
  }

  // RCD-13.B/RCD-14.D — SafetyReasonDetail assembly: null when no secondary codes remain,
  // otherwise { secondaryReasonCodes }.
  function buildReasonDetail(secondaryCodes) {
    if (!secondaryCodes || secondaryCodes.length === 0) return null;
    return freezeShallow({ secondaryReasonCodes: freezeShallow(secondaryCodes.slice()) });
  }

  // The complete Canonical Safety Rule evaluation model (RCD-12.E, RCD-14.A-D), pure and
  // independently testable: per-Rule predicate evaluation -> cross-Rule disposition precedence
  // -> same-disposition tie-break -> primary/secondary reasonCode assembly. `matchedRules`: an
  // array of dimension tuples (see evaluateRulePredicate's doc above) — the shape
  // matchCanonicalSafetyRules() would produce for each genuinely matched Canonical Safety Rule.
  // Zero matched Rules is RCD-12.E's own UNMODIFIED case directly ("no repository-supported
  // safety conflict exists"), not synthesized through a NONE-RiskType Rule Result.
  function evaluateCanonicalSafetyRules(matchedRules) {
    if (!matchedRules || matchedRules.length === 0) {
      return { disposition: 'UNMODIFIED', reasonCode: 'NO_SAFETY_CONFLICT', reasonDetail: null };
    }
    var ruleResults = matchedRules.map(function (dims) {
      var disposition = evaluateRulePredicate(dims);
      var reasonCode = reasonCodeForRule(dims, disposition);
      var out = {};
      for (var k in dims) { if (Object.prototype.hasOwnProperty.call(dims, k)) out[k] = dims[k]; }
      out.disposition = disposition;
      out.reasonCode = reasonCode;
      return out;
    });
    var winningDisposition = selectWinningDisposition(ruleResults);
    var filtered = ruleResults.filter(function (r) { return r.disposition === winningDisposition; });
    var picked = selectPrimaryAndSecondary(filtered);
    return {
      disposition: winningDisposition,
      reasonCode: picked.primary.reasonCode,
      reasonDetail: buildReasonDetail(picked.secondaryCodes)
    };
  }

  // WP0 Phase D.6 (§14) — a small, additive, pure helper: re-derives which matched dims tuple is
  // the PRIMARY result for a given winning disposition, so finalReview() can read that tuple's own
  // `domain` (needed to source modifiedContent from the correct safeAlternativeCharacterization
  // entry). Deliberately NOT folded into evaluateCanonicalSafetyRules() itself — that function's
  // own return shape ({disposition,reasonCode,reasonDetail}) is exact-matched by existing tests
  // across this file's own test corpus; this helper duplicates its small ruleResults-construction
  // step rather than risk widening that shared, heavily-tested contract. Returns null when no
  // matched rule contributed the winning disposition, or when the primary tuple carries no domain
  // (every non-risk-characteristic Rule's own dims — CSR-001/TRR-001's three — never do).
  function findPrimaryDomainForDisposition(matchedRules, winningDisposition) {
    if (!matchedRules || matchedRules.length === 0) return null;
    var ruleResults = matchedRules.map(function (dims) {
      var disposition = evaluateRulePredicate(dims);
      var out = {};
      for (var k in dims) { if (Object.prototype.hasOwnProperty.call(dims, k)) out[k] = dims[k]; }
      out.disposition = disposition;
      out.reasonCode = reasonCodeForRule(dims, disposition);
      return out;
    });
    var filtered = ruleResults.filter(function (r) { return r.disposition === winningDisposition; });
    var picked = selectPrimaryAndSecondary(filtered);
    return (picked.primary && typeof picked.primary.domain === 'string') ? picked.primary.domain : null;
  }

  // ══════════════════════════════════════════════════════════════════
  // SafetyIntegrationPort implementation — Stage 8 (D1-AH-02 binary absolute-override check,
  // SPEC Ch.14, narrower than the full Matrix) and Stage 9 (the full Safety Decision Matrix,
  // SPEC Ch.15-18).
  // ══════════════════════════════════════════════════════════════════

  // Stage 8 — binary disqualification against exactly the four D1-AH-02 absolute-override Rule
  // types (ABSOLUTE_OVERRIDE_RISK_TYPES), not the full five-disposition Matrix (SPEC Ch.14: "the
  // four categories fixed by [D1-AH-02]... Disqualification is binary; no graded/partial
  // disqualification exists in any canonical source"). Where more than one absolute-override Rule
  // matches the same Candidate simultaneously, the same RCD-14.C tie-break (Urgency ->
  // EvidenceConfidence -> Canonical Safety Rule Order; disposition precedence does not apply here,
  // since every matched Rule shares the same "disqualifying" outcome) selects the primary
  // reasonCode; every other matched Rule populates reasonDetail.secondaryReasonCodes.
  async function disqualify(candidatePool, pipelineContext) {
    candidatePool = Array.isArray(candidatePool) ? candidatePool : [];
    return candidatePool.map(function (candidate) {
      var matched = matchCanonicalSafetyRules(candidate, null, pipelineContext)
        .filter(function (dims) { return ABSOLUTE_OVERRIDE_RISK_TYPES.indexOf(dims.riskType) !== -1; })
        .map(function (dims) {
          var out = {};
          for (var k in dims) { if (Object.prototype.hasOwnProperty.call(dims, k)) out[k] = dims[k]; }
          out.reasonCode = dims.riskType;
          return out;
        });

      if (matched.length === 0) {
        return freezeShallow({
          opportunityProvenance: candidate && candidate.opportunityProvenance,
          disqualified: false,
          reasonCode: 'NO_SAFETY_CONFLICT',
          reasonDetail: null,
          reason: null
        });
      }

      var picked = selectPrimaryAndSecondary(matched);
      return freezeShallow({
        opportunityProvenance: candidate && candidate.opportunityProvenance,
        disqualified: true,
        reasonCode: picked.primary.reasonCode,
        reasonDetail: buildReasonDetail(picked.secondaryCodes),
        reason: picked.primary.reasonCode
      });
    });
  }

  // Stage 9 — the full Safety Decision Matrix (RCD-12/13/14), reviewing the pre-review Terminal
  // Decision assembled by Decision Formation (SPEC Ch.13, Ch.15). `candidate` (third, optional
  // argument) — per the Stage-9 Winning-Candidate Safety Input Canonical Decision
  // (docs/governance/FITME_Stage9_Winning_Candidate_Safety_Input_Canonical_Decision_v1.0.md) —
  // is the real winning Candidate for a SINGLE_WINNER Terminal Decision, supplied by
  // decisionFormation.js; it is omitted (undefined) for TIED_SET, exactly as before that Canonical
  // Decision, and for any caller (e.g. a direct/unit-level call) that does not supply one. This
  // additive parameter changes no Rule function, no enum, and no disposition-mapping logic below —
  // it only lets matchCanonicalSafetyRules() do, at Stage 9, what it has always done at Stage 8.
  async function finalReview(preReviewTerminalDecision, pipelineContext, candidate) {
    var matchedRules = matchCanonicalSafetyRules(candidate, preReviewTerminalDecision, pipelineContext);
    var evaluation = evaluateCanonicalSafetyRules(matchedRules);

    // RCD-13.D requires non-null modifiedContent for MODIFIED. WP0 Phase D.6 (§14) — MODIFIED is
    // now genuinely reachable via matchGovernedRiskCharacteristicRule()'s own governed
    // BOUNDED_MODIFICATION path; when it is the winning disposition, source modifiedContent from
    // the SAME candidate.safeAlternative content that governedCorrectabilityWithSafeAlternativeGate()
    // already independently verified was cleared for the matching domain — never re-verified here
    // a second, different way, and never fabricated when that content is absent/malformed (honest
    // null, exactly as this file has always done — no canonical content-generation algorithm
    // exists, per this file's own header). No other disposition ever sources modifiedContent.
    var modifiedContent = null;
    if (evaluation.disposition === 'MODIFIED') {
      var primaryDomain = findPrimaryDomainForDisposition(matchedRules, 'MODIFIED');
      if (primaryDomain && candidate && isPlainObject(candidate.safeAlternative)
        && typeof candidate.safeAlternative.action === 'string' && candidate.safeAlternative.action.length > 0) {
        modifiedContent = freezeShallow({ action: candidate.safeAlternative.action });
      }
    }

    return freezeShallow({
      disposition: evaluation.disposition,
      modifiedContent: modifiedContent,
      reasonCode: evaluation.reasonCode,
      reasonDetail: evaluation.reasonDetail,
      reason: evaluation.reasonCode === 'NO_SAFETY_CONFLICT' ? null : evaluation.reasonCode
    });
  }

  var API = {
    // Closed enums (RCD-12.A-D)
    RISK_TYPES: RISK_TYPES,
    EVIDENCE_CONFIDENCE: EVIDENCE_CONFIDENCE,
    CORRECTABILITY: CORRECTABILITY,
    URGENCY: URGENCY,
    CANONICAL_SAFETY_RULE_ORDER: CANONICAL_SAFETY_RULE_ORDER,
    ABSOLUTE_OVERRIDE_RISK_TYPES: ABSOLUTE_OVERRIDE_RISK_TYPES,

    // Pure, independently-testable evaluation-model internals (RCD-12.E, RCD-14.A-D)
    evaluateRulePredicate: evaluateRulePredicate,
    reasonCodeForRule: reasonCodeForRule,
    selectWinningDisposition: selectWinningDisposition,
    selectPrimaryAndSecondary: selectPrimaryAndSecondary,
    buildReasonDetail: buildReasonDetail,
    evaluateCanonicalSafetyRules: evaluateCanonicalSafetyRules,
    // WP0 Phase D.6 — exposed for direct unit testing, structurally parallel to the internals above.
    findPrimaryDomainForDisposition: findPrimaryDomainForDisposition,

    // Repository-evidence-bound matching — CSR-001's RUNNING Rule plus TRR-001's WALKING Rule and
    // Unresolved Activity Safety Coverage Rule (see file header)
    matchCanonicalSafetyRules: matchCanonicalSafetyRules,

    // TRR-001 (docs/specs/TRR_001_SPEC_v1.0.md §27/§28) — exposed for direct unit testing,
    // structurally parallel to the CSR-001 internals above.
    WALKING_TEXT_ACCEPTED_FORMS: WALKING_TEXT_ACCEPTED_FORMS,
    RULE_COVERED_ACTIVITIES: RULE_COVERED_ACTIVITIES,
    matchWalkingMedicalRestrictionRule: matchWalkingMedicalRestrictionRule,
    matchUnresolvedActivitySafetyCoverageRule: matchUnresolvedActivitySafetyCoverageRule,
    restrictionIsElsewhereIdentified: restrictionIsElsewhereIdentified,
    candidateOwnReferenceMatchesElsewhereVocabulary: candidateOwnReferenceMatchesElsewhereVocabulary,

    // WP0 Phase D.4 (docs/specs/WP0_SAFETY_RISK_CHARACTERISTIC_SUBSPEC_v1.0.md §12/§13/§14) —
    // exposed for direct unit testing, structurally parallel to the internals above.
    matchGovernedRiskCharacteristicRule: matchGovernedRiskCharacteristicRule,
    mapGovernedRiskCharacteristicTagToDims: mapGovernedRiskCharacteristicTagToDims,
    governedRiskCharacteristicInsufficientDims: governedRiskCharacteristicInsufficientDims,
    governedCorrectabilityWithSafeAlternativeGate: governedCorrectabilityWithSafeAlternativeGate,
    evidenceConfidenceForTag: evidenceConfidenceForTag,

    // SafetyIntegrationPort implementation (Stage 8 / Stage 9)
    disqualify: disqualify,
    finalReview: finalReview,

    // Stage 3 contribution, dispatched by internalPipelineOrchestrator.js
    detectSafetyOpportunities: detectSafetyOpportunities
  };

  if (typeof window !== 'undefined') { window.SafetyLayer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
