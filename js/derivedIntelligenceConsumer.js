// ══════════════════════════════════════════════════════════════════
// FitMe — Derived Intelligence Consumer (B5)
// אחריות בלעדית: ה-consumption adapter היחיד ל-Habit/Pattern Derived
// Intelligence Views. קורא snapshots דרך B3 State Access בלבד, מאמת
// מבנה, מסנן לפי Consumer Policy סגור (eligibility + relevance),
// מזהה חפיפות/סתירות, ומחזיר DerivedIntelligenceContext דטרמיניסטי
// ובלתי-ניתן-לשינוי. אינו כותב, אינו מפעיל את ה-LLM, אינו מחליט
// המלצות, ואינו מפעיל מחדש חישוב Producer. תלויות (state access,
// session, תאריך קנוני) מוזרקות דרך configure() על ידי js/app.js —
// לא נטענות ישירות כאן, כדי שהמודול יישאר ניתן לבדיקה עצמאית ב-Node
// (כמו js/stateAccess.js / js/persistenceGateway.js).
// ראה docs/tasks/B5/B5_SPEC_v1.0.md (תוכן קנוני v1.1).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var SCHEMA_VERSION = 'derived-intelligence-context/1.0';

  // ── תלויות מוזרקות (B5 §43: B3-approved state access בלבד) ──
  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function freezeShallow(obj) { try { return Object.freeze(obj); } catch (e) { return obj; } }
  function isNonEmptyString(s) { return typeof s === 'string' && s.length > 0; }
  function isFiniteNumber(n) { return typeof n === 'number' && isFinite(n); }
  function isCurrent(gen) { return !!(deps && typeof deps.isSessionCurrent === 'function' && deps.isSessionCurrent(gen)); }
  function round3(n) { return Math.round(n * 1000) / 1000; }

  // ══════════════════════════════════════════════════════════════════
  // ── Closed catalogs (B5 §12.3/12.4/12.5/12.7, §16) ──
  // ══════════════════════════════════════════════════════════════════
  var CONSUMERS = ['AI_COACH_PROMPT', 'RECOMMENDATION_ENGINE', 'INITIATIVE_ENGINE', 'DECISION_ENGINE', 'TEST_HARNESS'];
  // B5 §12.3: AI_COACH_PROMPT ו-TEST_HARNESS הם runtime consumers מאושרים. RECOMMENDATION_ENGINE
  // מאושר כ-contract/test target בלבד — build() פותר עבורו policy (RECOMMENDATION_SUPPORT_V1)
  // כדי לאפשר בדיקה, אך אף קוד production (js/app.js) אינו קורא לו בפועל עד מפרט נפרד.
  // INITIATIVE_ENGINE/DECISION_ENGINE נותרים מושבתים לחלוטין.
  var ENABLED_CONSUMERS = ['AI_COACH_PROMPT', 'RECOMMENDATION_ENGINE', 'TEST_HARNESS'];
  var DOMAINS = ['NUTRITION', 'WORKOUT', 'WEIGHT', 'MEASUREMENT', 'ENGAGEMENT', 'GENERAL_COACHING'];
  // B5 §12.5: "the initial implementation MAY define only the topic IDs represented by current
  // producer records" — הרשימה כאן היא בדיוק מה שנדרש לקטלוג ה-catalog IDs הקיים של
  // Habit/Pattern (ראה HABIT_KEY_MAP / PATTERN_ID_MAP למטה), ללא הרחבה.
  var TOPICS = ['MEAL_TIMING', 'PROTEIN_INTAKE', 'FOOD_LOGGING', 'WORKOUT_FREQUENCY',
    'WEIGH_IN_FREQUENCY', 'WEEKDAY_BEHAVIOR', 'SEQUENCE_BEHAVIOR', 'MEASUREMENT_LOGGING'];
  var CONTEXT_EVENTS = ['WORKOUT_COMPLETED', 'WEIGH_IN_RECORDED', 'MEASUREMENT_RECORDED', 'MEAL_LOGGED'];
  var TIME_SEGMENTS = ['MORNING', 'MIDDAY', 'EVENING', 'NIGHT'];
  var LIFECYCLES = ['OBSERVED', 'CANDIDATE', 'CONFIRMED', 'ACTIVE', 'WEAKENING', 'INACTIVE', 'UNKNOWN'];
  var WEEKDAY_QUALIFIER = ['ON_SUNDAY', 'ON_MONDAY', 'ON_TUESDAY', 'ON_WEDNESDAY', 'ON_THURSDAY', 'ON_FRIDAY', 'ON_SATURDAY'];

  var API_ERROR_CODES = freezeShallow({
    INVALID_REQUEST: 'INVALID_REQUEST', UNKNOWN_CONSUMER: 'UNKNOWN_CONSUMER', UNKNOWN_POLICY: 'UNKNOWN_POLICY',
    POLICY_NOT_ALLOWED_FOR_CONSUMER: 'POLICY_NOT_ALLOWED_FOR_CONSUMER', UNKNOWN_DOMAIN: 'UNKNOWN_DOMAIN',
    SESSION_STALE: 'SESSION_STALE', STATE_ACCESS_UNAVAILABLE: 'STATE_ACCESS_UNAVAILABLE',
    HABIT_VIEW_INVALID: 'HABIT_VIEW_INVALID', PATTERN_VIEW_INVALID: 'PATTERN_VIEW_INVALID',
    CONTEXT_BUILD_FAILED: 'CONTEXT_BUILD_FAILED', UNSUPPORTED_SCHEMA_VERSION: 'UNSUPPORTED_SCHEMA_VERSION'
  });

  // ══════════════════════════════════════════════════════════════════
  // ── Consumer Policy Catalog (B5 §19, Appendix A — locked constants) ──
  // ══════════════════════════════════════════════════════════════════
  var POLICIES = {
    COACH_PROMPT_V1: {
      allowedLifecycle: ['ACTIVE', 'CONFIRMED'], minimumConfidence: 0.75, minimumEvidenceDefault: 3,
      allowWeakening: false, maxSignals: 8, maxHabits: 4, maxPatterns: 4,
      includeUnresolvedContradictions: false, includeDetailedDiagnostics: false, hardStalenessMultiplier: 2.0
    },
    RECOMMENDATION_SUPPORT_V1: {
      allowedLifecycle: ['ACTIVE', 'CONFIRMED', 'WEAKENING'], minimumConfidence: 0.65, minimumEvidenceDefault: 3,
      allowWeakening: true, maxSignals: 20, maxHabits: 10, maxPatterns: 10,
      includeUnresolvedContradictions: true, includeDetailedDiagnostics: false, hardStalenessMultiplier: 3.0
    },
    TEST_FULL_DIAGNOSTIC_V1: {
      allowedLifecycle: ['ACTIVE', 'CONFIRMED', 'WEAKENING', 'OBSERVED', 'CANDIDATE'], minimumConfidence: 0,
      minimumEvidenceDefault: 0, allowWeakening: true, maxSignals: 50, maxHabits: 50, maxPatterns: 50,
      includeUnresolvedContradictions: true, includeDetailedDiagnostics: true, hardStalenessMultiplier: 100
    }
  };
  // B5 §51.1: מיפוי סגור consumer->policy. INITIATIVE/DECISION מושבתים (§12.3) ולכן חסרים כאן בכוונה —
  // בקשה עבורם נכשלת כ-UNKNOWN_CONSUMER לפני שמגיעים בכלל לשלב resolvePolicy.
  var CONSUMER_POLICY = {
    AI_COACH_PROMPT: 'COACH_PROMPT_V1',
    RECOMMENDATION_ENGINE: 'RECOMMENDATION_SUPPORT_V1',
    TEST_HARNESS: 'TEST_FULL_DIAGNOSTIC_V1'
  };

  // ══════════════════════════════════════════════════════════════════
  // ── Domain/Topic/Qualifier mapping (B5 §67 Q9 — נעול ע"י ה-External
  // Engineering Readiness Review; ראה docs/tasks/B5/B5_SPEC_v1.0.md).
  // Habit: type -> domain ישיר (1:1, קיים כבר על הרשומה). Pattern: אין
  // domain על הרשומה עצמה — ממופה מ-catalog id סגור (isCatalogId ב-app.js).
  // ══════════════════════════════════════════════════════════════════
  var HABIT_TYPE_DOMAIN = { nutrition: 'NUTRITION', workout: 'WORKOUT', weight: 'WEIGHT', measurement: 'MEASUREMENT' };

  function mapHabitTopic(type, key) {
    if (key.indexOf('meal:') === 0) {
      var seg = key.slice(5).toUpperCase(); // 'meal:evening' -> 'EVENING'
      return { topic: 'MEAL_TIMING', qualifiers: TIME_SEGMENTS.indexOf(seg) !== -1 ? [seg] : [] };
    }
    if (key === 'log-consistency') return { topic: 'FOOD_LOGGING', qualifiers: [] };
    if (key.indexOf('weekday:') === 0) {
      var wd = parseInt(key.slice(8), 10);
      return { topic: 'WORKOUT_FREQUENCY', qualifiers: (wd >= 0 && wd <= 6) ? [WEEKDAY_QUALIFIER[wd]] : [] };
    }
    if (key === 'weigh-in') return { topic: 'WEIGH_IN_FREQUENCY', qualifiers: [] };
    if (key === 'measure') return { topic: 'MEASUREMENT_LOGGING', qualifiers: [] };
    return null; // לא מוכר -> UNSUPPORTED_LEGACY_SHAPE (B5 §17.5)
  }

  // catalog ID קבוע -> {domain, topic, qualifiers}. sequence.weigh_measure_together מוקצה
  // ל-MEASUREMENT באופן מתועד (חוצה-domain במהותו — weight+measurement יחד; ה-Engineering
  // Readiness Review קבע שזו מגבלה ידועה, לא חוסמת, ר' B5-BLOCK ranking בסבב הביקורת).
  var PATTERN_ID_MAP = {
    'time.first_meal_window': { domain: 'NUTRITION', topic: 'MEAL_TIMING', qualifiers: ['FIRST_MEAL'] },
    'time.last_meal_window': { domain: 'NUTRITION', topic: 'MEAL_TIMING', qualifiers: ['LAST_MEAL'] },
    'sequence.workout_day_high_protein': { domain: 'NUTRITION', topic: 'PROTEIN_INTAKE', qualifiers: ['AFTER_WORKOUT'] },
    'sequence.workout_back_to_back': { domain: 'WORKOUT', topic: 'SEQUENCE_BEHAVIOR', qualifiers: ['AFTER_WORKOUT'] },
    'sequence.rest_after_workout': { domain: 'WORKOUT', topic: 'SEQUENCE_BEHAVIOR', qualifiers: ['AFTER_WORKOUT'] },
    'sequence.weigh_measure_together': { domain: 'MEASUREMENT', topic: 'SEQUENCE_BEHAVIOR', qualifiers: ['WHEN_LOGGING_IS_ACTIVE'] },
    'frequency.meals_per_day': { domain: 'NUTRITION', topic: 'FOOD_LOGGING', qualifiers: [] },
    'frequency.workouts_per_week': { domain: 'WORKOUT', topic: 'WORKOUT_FREQUENCY', qualifiers: [] }
  };
  function mapPatternTopic(id) {
    if (PATTERN_ID_MAP[id]) return PATTERN_ID_MAP[id];
    var wm = /^weekday\.(active|skip)\.([0-6])$/.exec(id);
    if (wm) {
      var wd = +wm[2];
      return { domain: 'NUTRITION', topic: 'WEEKDAY_BEHAVIOR', qualifiers: [WEEKDAY_QUALIFIER[wd], wm[1].toUpperCase()] };
    }
    return null; // לא מוכר -> UNSUPPORTED_LEGACY_SHAPE
  }

  function normalizeQualifiers(arr) {
    return freezeShallow((arr || []).slice().sort());
  }

  // ══════════════════════════════════════════════════════════════════
  // ── עזרי תאריך/שבוע דטרמיניסטיים — עותק עצמאי, בלי צימוד למנועים אחרים
  // (אותו עיקרון כמו Pattern Engine — ר' app.js "עותק עצמאי") ──
  // ══════════════════════════════════════════════════════════════════
  function toDate(k) { var p = String(k).split('-'); return new Date(+p[0], (+p[1]) - 1, +p[2]); }
  function wholeLocalDateDifference(a, b) {
    if (!a || !b) return null;
    return Math.round((toDate(a) - toDate(b)) / 86400000);
  }

  // ══════════════════════════════════════════════════════════════════
  // ── שגיאות/תוצאות מנורמלות (B5 §11.1) ──
  // ══════════════════════════════════════════════════════════════════
  function rejected(code, message) {
    return freezeShallow({ status: 'REJECTED', context: null, error: freezeShallow({ code: code, message: message || null }) });
  }
  function staleSession() {
    return freezeShallow({ status: 'STALE_SESSION', context: null, error: freezeShallow({ code: 'SESSION_STALE', message: 'session changed during build' }) });
  }
  function failed(code, message) {
    return freezeShallow({ status: 'FAILED', context: null, error: freezeShallow({ code: code, message: message || null }) });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── 1. Validate Request Structure (B5 §12) ──
  // ══════════════════════════════════════════════════════════════════
  function validateRequest(request) {
    if (!request || typeof request !== 'object') return 'request is required';
    if (!isNonEmptyString(request.requestId)) return 'requestId is required';
    if (CONSUMERS.indexOf(request.consumer) === -1) return '__UNKNOWN_CONSUMER__';
    if (!isNonEmptyString(request.policyId)) return 'policyId is required';
    if (!request.session || !isNonEmptyString(request.session.uid)) return 'session.uid is required';
    if (typeof request.session.generation === 'undefined' || request.session.generation === null) return 'session.generation is required';
    if (!request.intent || DOMAINS.indexOf(request.intent.domain) === -1) return '__UNKNOWN_DOMAIN__';
    if (request.intent.purpose !== 'IMMEDIATE' && request.intent.purpose !== 'REVIEW') return 'intent.purpose must be IMMEDIATE or REVIEW';
    if (request.intent.topics) {
      if (!Array.isArray(request.intent.topics)) return 'intent.topics must be an array';
      for (var i = 0; i < request.intent.topics.length; i++) {
        if (TOPICS.indexOf(request.intent.topics[i]) === -1) return 'unknown topic: ' + request.intent.topics[i];
      }
    }
    if (request.intent.contextEvents) {
      if (!Array.isArray(request.intent.contextEvents)) return 'intent.contextEvents must be an array';
      for (var j = 0; j < request.intent.contextEvents.length; j++) {
        if (CONTEXT_EVENTS.indexOf(request.intent.contextEvents[j]) === -1) return 'unknown contextEvent: ' + request.intent.contextEvents[j];
      }
    }
    if (request.limits) {
      var lim = request.limits;
      if (typeof lim.maxSignals !== 'undefined' && (typeof lim.maxSignals !== 'number' || lim.maxSignals < 0)) return 'limits.maxSignals must be >= 0';
      if (typeof lim.maxHabits !== 'undefined' && (typeof lim.maxHabits !== 'number' || lim.maxHabits < 0)) return 'limits.maxHabits must be >= 0';
      if (typeof lim.maxPatterns !== 'undefined' && (typeof lim.maxPatterns !== 'number' || lim.maxPatterns < 0)) return 'limits.maxPatterns must be >= 0';
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── 2. Resolve Policy (B5 §51) ──
  // ══════════════════════════════════════════════════════════════════
  function resolvePolicy(consumer, policyId) {
    if (ENABLED_CONSUMERS.indexOf(consumer) === -1) return { error: 'UNKNOWN_CONSUMER' };
    var allowed = CONSUMER_POLICY[consumer];
    if (!POLICIES[policyId]) return { error: 'UNKNOWN_POLICY' };
    if (allowed !== policyId) return { error: 'POLICY_NOT_ALLOWED_FOR_CONSUMER' };
    return { policy: POLICIES[policyId], policyId: policyId };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Snapshot envelope (B5 §13 DerivedViewSnapshot) ──
  // הבניה מהצורה הגולמית שמחזיר B3 State Access ({habits,habitsMeta}/
  // {patterns,patternsMeta}) לכדי envelope מפורש. durableAligned=true
  // תמיד: אין אינדיקטור in-flight-write זמין כיום דרך state access
  // (Engineering Readiness Review §18.1 — "use the strongest approved
  // indicator available"; לא קיים כזה כרגע, מתועד).
  // ══════════════════════════════════════════════════════════════════
  function buildHabitSnapshot(raw) {
    if (!raw) return { sourceType: 'HABIT', records: [], meta: null, availability: 'UNAVAILABLE', durableAligned: false, producerId: 'habitEngine', producerVersion: null, sourceFingerprint: null };
    var meta = raw.habitsMeta || {};
    var records = Array.isArray(raw.habits) ? raw.habits : [];
    return {
      sourceType: 'HABIT', records: records, meta: meta,
      availability: records.length ? 'AVAILABLE' : 'EMPTY',
      durableAligned: true, producerId: 'habitEngine',
      producerVersion: (typeof meta.version !== 'undefined' && meta.version !== null) ? String(meta.version) : null,
      sourceFingerprint: null // Habit לא מחשב fingerprint (B3 SPEC — לא כמו Pattern)
    };
  }
  function buildPatternSnapshot(raw) {
    if (!raw) return { sourceType: 'PATTERN', records: [], meta: null, availability: 'UNAVAILABLE', durableAligned: false, producerId: 'patternEngine', producerVersion: null, sourceFingerprint: null };
    var meta = raw.patternsMeta || {};
    var records = Array.isArray(raw.patterns) ? raw.patterns : [];
    return {
      sourceType: 'PATTERN', records: records, meta: meta,
      availability: records.length ? 'AVAILABLE' : 'EMPTY',
      durableAligned: true, producerId: 'patternEngine',
      producerVersion: (typeof meta.version !== 'undefined' && meta.version !== null) ? String(meta.version) : null,
      sourceFingerprint: meta.sourceFingerprint || null
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Structural validation + normalization (B5 §15/§17) ──
  // ══════════════════════════════════════════════════════════════════
  function isValidConfidence(c) { return isFiniteNumber(c) && c >= 0 && c <= 1; }

  function normalizeLifecycle(raw) {
    var u = (typeof raw === 'string') ? raw.toUpperCase() : '';
    return LIFECYCLES.indexOf(u) !== -1 ? u : 'UNKNOWN';
  }

  // מחזיר { signal } בהצלחה, או { excluded: {sourceType, sourceId, codes[]} } בכשל.
  function normalizeHabitRecord(rec, meta, producerVersion) {
    if (!rec || !isNonEmptyString(rec.id)) return { excluded: { sourceType: 'HABIT', sourceId: rec && rec.id, codes: ['INVALID_RECORD_SHAPE'] } };
    var sourceId = rec.id;
    if (!isValidConfidence(rec.confidence)) return { excluded: { sourceType: 'HABIT', sourceId: sourceId, codes: ['INVALID_CONFIDENCE'] } };
    if (isFiniteNumber(rec.sourceEvents && rec.sourceEvents.count) === false) return { excluded: { sourceType: 'HABIT', sourceId: sourceId, codes: ['INVALID_RECORD_SHAPE'] } };
    if (rec.sourceEvents.count < 0) return { excluded: { sourceType: 'HABIT', sourceId: sourceId, codes: ['INSUFFICIENT_EVIDENCE'] } };
    var domain = HABIT_TYPE_DOMAIN[rec.type];
    var topicInfo = domain ? mapHabitTopic(rec.type, rec.key || '') : null;
    if (!domain || !topicInfo) return { excluded: { sourceType: 'HABIT', sourceId: sourceId, codes: ['UNSUPPORTED_LEGACY_SHAPE'] } };
    var lifecycle = normalizeLifecycle(rec.status);
    var signal = {
      id: 'HABIT:' + sourceId, sourceType: 'HABIT', sourceId: sourceId,
      producerId: 'habitEngine', producerVersion: producerVersion, domain: domain, topic: topicInfo.topic,
      labelKey: sourceId, lifecycle: lifecycle, confidence: rec.confidence,
      evidence: freezeShallow({ count: rec.sourceEvents.count, opportunityCount: undefined, strength: (typeof rec.consistency === 'number') ? rec.consistency : undefined }),
      temporal: freezeShallow({
        firstObservedAt: rec.firstObserved || undefined, lastObservedAt: rec.lastObserved || undefined,
        expectedIntervalDays: (typeof rec.expectedIntervalDays === 'number') ? rec.expectedIntervalDays : undefined,
        windowDays: (rec.sourceEvents && typeof rec.sourceEvents.window === 'number') ? rec.sourceEvents.window : undefined,
        weekday: undefined, timeSegment: undefined
      }),
      qualifiers: normalizeQualifiers(topicInfo.qualifiers),
      provenance: freezeShallow({ sourceView: 'HABITS_VIEW', sourceFingerprint: undefined, durableAligned: true }),
      consumption: { relevanceScore: 0, freshnessScore: 0, inclusionReasons: [] } // מולא בהמשך
    };
    return { signal: signal };
  }

  function normalizePatternRecord(rec, meta, producerVersion, sourceFingerprint) {
    if (!rec || !isNonEmptyString(rec.id)) return { excluded: { sourceType: 'PATTERN', sourceId: rec && rec.id, codes: ['INVALID_RECORD_SHAPE'] } };
    var sourceId = rec.id;
    if (!isValidConfidence(rec.confidence)) return { excluded: { sourceType: 'PATTERN', sourceId: sourceId, codes: ['INVALID_CONFIDENCE'] } };
    if (!isFiniteNumber(rec.evidenceCount) || rec.evidenceCount < 0) return { excluded: { sourceType: 'PATTERN', sourceId: sourceId, codes: ['INSUFFICIENT_EVIDENCE'] } };
    if (typeof rec.opportunityCount === 'number' && rec.opportunityCount < rec.evidenceCount) return { excluded: { sourceType: 'PATTERN', sourceId: sourceId, codes: ['INVALID_RECORD_SHAPE'] } };
    var topicInfo = mapPatternTopic(sourceId);
    if (!topicInfo) return { excluded: { sourceType: 'PATTERN', sourceId: sourceId, codes: ['UNSUPPORTED_LEGACY_SHAPE'] } };
    var lifecycle = normalizeLifecycle(rec.status);
    var signal = {
      id: 'PATTERN:' + sourceId, sourceType: 'PATTERN', sourceId: sourceId,
      producerId: 'patternEngine', producerVersion: producerVersion, domain: topicInfo.domain, topic: topicInfo.topic,
      labelKey: sourceId, lifecycle: lifecycle, confidence: rec.confidence,
      evidence: freezeShallow({ count: rec.evidenceCount, opportunityCount: (typeof rec.opportunityCount === 'number') ? rec.opportunityCount : undefined, strength: (typeof rec.strength === 'number') ? rec.strength : undefined }),
      temporal: freezeShallow({
        firstObservedAt: rec.firstSeen || undefined, lastObservedAt: rec.lastSeen || undefined,
        expectedIntervalDays: (typeof rec.expectedIntervalDays === 'number') ? rec.expectedIntervalDays : undefined,
        windowDays: (typeof rec.window === 'number') ? rec.window : undefined,
        weekday: undefined, timeSegment: undefined
      }),
      qualifiers: normalizeQualifiers(topicInfo.qualifiers),
      provenance: freezeShallow({ sourceView: 'PATTERNS_VIEW', sourceFingerprint: sourceFingerprint || undefined, durableAligned: true }),
      consumption: { relevanceScore: 0, freshnessScore: 0, inclusionReasons: [] }
    };
    return { signal: signal };
  }

  // B5 §17.6: כפילויות source ID — byte-equivalent מתמזגות, לא-שוות מסומנות קונפליקט.
  // items הם עטיפות {signal}/{excluded} (פלט normalizeHabitRecord/normalizePatternRecord) —
  // sourceType/sourceId חיים בתוך העטיפה, לא ברמה העליונה.
  function itemIdentity(it) {
    var s = it.signal || it.excluded;
    return { sourceType: s.sourceType, sourceId: s.sourceId, key: s.sourceType + ':' + s.sourceId };
  }
  function resolveDuplicates(items) {
    var bySourceId = {};
    var order = [];
    items.forEach(function (it) {
      var id = itemIdentity(it);
      if (!bySourceId[id.key]) { bySourceId[id.key] = []; order.push(id.key); }
      bySourceId[id.key].push(it);
    });
    var result = [];
    order.forEach(function (key) {
      var group = bySourceId[key];
      if (group.length === 1) { result.push(group[0]); return; }
      var first = JSON.stringify(group[0].signal || group[0].excluded);
      var allEqual = group.every(function (g) { return JSON.stringify(g.signal || g.excluded) === first; });
      if (allEqual) { result.push(group[0]); return; }
      var id0 = itemIdentity(group[0]);
      result.push({ excluded: { sourceType: id0.sourceType, sourceId: id0.sourceId, codes: ['DUPLICATE_SOURCE_ID_CONFLICT'] } });
    });
    return result;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Freshness (B5 §22 — נעול, v1.1) ──
  // ══════════════════════════════════════════════════════════════════
  function computeFreshness(signal, requestLocalDate, policy) {
    var lastObserved = signal.temporal.lastObservedAt;
    if (!isNonEmptyString(lastObserved)) return { unknown: true, freshnessScore: 0, ageDays: null, referenceDays: null, hardStale: false };
    var lastObservedDate = lastObserved.length > 10 ? lastObserved.slice(0, 10) : lastObserved; // תומך גם ב-ISO timestamp: חותך ל-YYYY-MM-DD (B5 §22.3: whole-local-date בלבד)
    var ageDays = wholeLocalDateDifference(requestLocalDate, lastObservedDate);
    if (ageDays === null) return { unknown: true, freshnessScore: 0, ageDays: null, referenceDays: null, hardStale: false };
    ageDays = Math.max(0, ageDays);
    var sourceFallbackDays = signal.sourceType === 'HABIT' ? 7 : 30;
    var referenceDays = Math.max(1, signal.temporal.expectedIntervalDays || signal.temporal.windowDays || sourceFallbackDays);
    var freshnessScore = clamp01(1 - (ageDays / (referenceDays * policy.hardStalenessMultiplier)));
    var hardStale = ageDays > referenceDays * policy.hardStalenessMultiplier;
    return { unknown: false, freshnessScore: round3(freshnessScore), ageDays: ageDays, referenceDays: referenceDays, hardStale: hardStale };
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  // ══════════════════════════════════════════════════════════════════
  // ── Eligibility (B5 §16/§18/§20/§21/§22) ──
  // ══════════════════════════════════════════════════════════════════
  function evaluateEligibility(signal, policy, now) {
    var codes = [];
    if (policy.allowedLifecycle.indexOf(signal.lifecycle) === -1) codes.push('INELIGIBLE_LIFECYCLE');
    if (signal.confidence < policy.minimumConfidence) codes.push('BELOW_CONFIDENCE_THRESHOLD');
    var minEvidence = policy.minimumEvidenceDefault;
    if (signal.evidence.count < minEvidence) codes.push('INSUFFICIENT_EVIDENCE');
    var fresh = computeFreshness(signal, now, policy);
    if (fresh.unknown) codes.push('FRESHNESS_UNKNOWN');
    else if (fresh.hardStale) codes.push('STALE_SIGNAL');
    return { eligible: codes.length === 0, codes: codes, freshnessScore: fresh.freshnessScore };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Relevance (B5 §23) ──
  // ══════════════════════════════════════════════════════════════════
  function evaluateRelevance(signal, intent) {
    var codes = [];
    var reasons = [];
    // דומיין: GENERAL_COACHING מקבל signals חוצי-דומיין (B5 §23.1)
    var domainOk = (intent.domain === 'GENERAL_COACHING') || (signal.domain === intent.domain);
    if (!domainOk) { codes.push('DOMAIN_MISMATCH'); }
    else reasons.push('DOMAIN_MATCH');

    var topicMatch = 'none';
    if (intent.topics && intent.topics.length) {
      if (intent.topics.indexOf(signal.topic) !== -1) { topicMatch = 'exact'; reasons.push('TOPIC_MATCH'); }
      else { codes.push('TOPIC_MISMATCH'); }
    } else { topicMatch = 'unfiltered'; }

    // זמן/רצף: signal בלי qualifiers רלוונטי תמיד. עם qualifiers — תלוי purpose.
    var temporalQualifiers = signal.qualifiers.filter(function (q) { return q.indexOf('ON_') === 0 || q === 'MORNING' || q === 'MIDDAY' || q === 'EVENING' || q === 'NIGHT'; });
    var temporalMatch = 'full';
    if (temporalQualifiers.length) {
      var weekdayQualifier = intent.weekday === 0 || intent.weekday ? WEEKDAY_QUALIFIER[intent.weekday] : null;
      var segQualifier = intent.localTimeSegment || null;
      var matches = temporalQualifiers.some(function (q) { return q === weekdayQualifier || q === segQualifier; });
      if (matches) { temporalMatch = 'full'; reasons.push('CURRENT_TEMPORAL_MATCH'); }
      else if (intent.purpose === 'REVIEW') { temporalMatch = 'relaxed'; }
      else { temporalMatch = 'none'; codes.push('TEMPORAL_QUALIFIER_MISMATCH'); }
    }

    var sequenceQualifiers = signal.qualifiers.filter(function (q) { return q === 'AFTER_WORKOUT' || q === 'WHEN_LOGGING_IS_ACTIVE'; });
    var sequenceMatch = 'full';
    if (sequenceQualifiers.length) {
      var events = intent.contextEvents || [];
      var required = { AFTER_WORKOUT: 'WORKOUT_COMPLETED', WHEN_LOGGING_IS_ACTIVE: null };
      var satisfied = sequenceQualifiers.every(function (q) {
        var req = required[q];
        return req === null || events.indexOf(req) !== -1;
      });
      if (satisfied) { sequenceMatch = 'full'; reasons.push('SEQUENCE_CONTEXT_MATCH'); }
      else if (intent.purpose === 'REVIEW') { sequenceMatch = 'relaxed'; }
      else { sequenceMatch = 'none'; codes.push('SEQUENCE_PREREQUISITE_MISSING'); }
    }

    var relevant = domainOk && codes.indexOf('TOPIC_MISMATCH') === -1 &&
      codes.indexOf('TEMPORAL_QUALIFIER_MISMATCH') === -1 && codes.indexOf('SEQUENCE_PREREQUISITE_MISSING') === -1;

    var topicComponent = topicMatch === 'exact' ? 1 : (topicMatch === 'unfiltered' ? 0.6 : 0);
    var temporalComponent = temporalMatch === 'full' ? 1 : (temporalMatch === 'relaxed' ? 0.5 : 0);
    var sequenceComponent = sequenceMatch === 'full' ? 1 : (sequenceMatch === 'relaxed' ? 0.5 : 0);

    return { relevant: relevant, codes: codes, reasons: reasons, scoreComponents: { topicComponent: topicComponent, temporalComponent: temporalComponent, sequenceComponent: sequenceComponent } };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Contradiction Detection (B5 §26) ──
  // ══════════════════════════════════════════════════════════════════
  function opposingQualifierSets(a, b) {
    // OPPOSING_BEHAVIOR צר: אותו domain/topic, אותם qualifiers חוץ מ-tendency הפוך (ACTIVE/SKIP)
    if (a.domain !== b.domain || a.topic !== b.topic) return false;
    var qa = a.qualifiers.filter(function (q) { return q !== 'ACTIVE' && q !== 'SKIP'; });
    var qb = b.qualifiers.filter(function (q) { return q !== 'ACTIVE' && q !== 'SKIP'; });
    if (qa.length !== qb.length || qa.join('|') !== qb.join('|')) return false;
    var aTendency = a.qualifiers.indexOf('ACTIVE') !== -1 ? 'ACTIVE' : (a.qualifiers.indexOf('SKIP') !== -1 ? 'SKIP' : null);
    var bTendency = b.qualifiers.indexOf('ACTIVE') !== -1 ? 'ACTIVE' : (b.qualifiers.indexOf('SKIP') !== -1 ? 'SKIP' : null);
    return aTendency && bTendency && aTendency !== bTendency;
  }
  function detectContradictions(signals) {
    var contradictions = [];
    for (var i = 0; i < signals.length; i++) {
      for (var j = i + 1; j < signals.length; j++) {
        if (opposingQualifierSets(signals[i], signals[j])) {
          var ids = [signals[i].id, signals[j].id].sort();
          contradictions.push(freezeShallow({
            id: 'CONTRA:' + ids.join('|'), signalIds: freezeShallow(ids),
            category: 'OPPOSING_BEHAVIOR', resolvableByContext: false
          }));
        }
      }
    }
    return contradictions;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Overlap Detection + Primary Selection (B5 §25) ──
  // specificity (B5 §24.2/§25.5 — לא מוגדר פורמלית ב-SPEC; ה-Engineering
  // Readiness Review קבע פרשנות סבירה חסומה: מספר qualifiers לא-ריקים,
  // עקבי עם כל הדוגמאות שב-SPEC (סימן זמן/רצף מוסיף specificity)).
  //
  // Overlap Key (B5 §25.3 recommended): <domain>|<topic>|<labelFamily>|<normalizedQualifiers>.
  // topic משמש כאן גם כ-"semantic label family" (§25.2) — אוצר המילים של ה-topics
  // עוצב מלכתחילה כמאחד Habit+Pattern תחת אותה משבצת סמנטית (ר' תיעוד המיפוי), ולכן אין
  // family נפרד/עצמאי מעבר לכך. "compatible qualifiers" (§25.2 — תואמים, לא בהכרח זהים):
  // סט ריק (general) תואם לכל סט אחר; שני סטים לא-ריקים תואמים רק אם זהים לחלוטין —
  // כך "מדידת ערב כללית" (Habit, ריק) ו"יום שישי ספציפי" (Pattern, לא ריק) יכולים
  // להיחשב כמייצגים חלופיים לאותה עובדה (§24.2 הדוגמה), בעוד MORNING מול EVENING
  // (שני סטים לא-ריקים שונים) נשארים אותות נפרדים — אין אובדן מידע (§25.6).
  // התאמה מחושבת per-pair (union-find בתוך כל domain|topic bucket), לא hashmap יחיד,
  // כי תאימות אינה טרנזיטיבית מובנית (general תואם לכל specific, שני specific שונים לא).
  function specificityOf(signal) { return signal.qualifiers.length; }

  function qualifiersCompatible(qa, qb) {
    if (!qa.length || !qb.length) return true;
    if (qa.length !== qb.length) return false;
    return qa.join('|') === qb.join('|');
  }
  function familyBucketKey(signal) { return signal.domain + '|' + signal.topic; }

  // §25.5 שלב 1 "Exact request qualifier match": אות כללי (ללא temporal/sequence
  // qualifiers) תואם באופן ריק-מאליו תמיד; אות עם qualifiers כאלה תואם רק אם ה-relevance
  // evaluation דיווחה בפועל CURRENT_TEMPORAL_MATCH/SEQUENCE_CONTEXT_MATCH (ולא 'relaxed',
  // למשל תחת purpose=REVIEW) — נגזר מ-qualifiers+inclusionReasons הקיימים, בלי שדה חדש.
  function matchesCurrentContext(signal) {
    var hasTemporalQualifier = signal.qualifiers.some(function (q) { return q.indexOf('ON_') === 0 || q === 'MORNING' || q === 'MIDDAY' || q === 'EVENING' || q === 'NIGHT'; });
    var hasSequenceQualifier = signal.qualifiers.some(function (q) { return q === 'AFTER_WORKOUT' || q === 'WHEN_LOGGING_IS_ACTIVE'; });
    if (!hasTemporalQualifier && !hasSequenceQualifier) return true;
    var reasons = signal.consumption.inclusionReasons || [];
    var temporalOk = !hasTemporalQualifier || reasons.indexOf('CURRENT_TEMPORAL_MATCH') !== -1;
    var sequenceOk = !hasSequenceQualifier || reasons.indexOf('SEQUENCE_CONTEXT_MATCH') !== -1;
    return temporalOk && sequenceOk;
  }
  function primarySelectionComparator(a, b) {
    var aExact = matchesCurrentContext(a) ? 1 : 0;
    var bExact = matchesCurrentContext(b) ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    var sa = specificityOf(a), sb = specificityOf(b);
    if (sa !== sb) return sb - sa;
    if (a.consumption.relevanceScore !== b.consumption.relevanceScore) return b.consumption.relevanceScore - a.consumption.relevanceScore;
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    if (a.consumption.freshnessScore !== b.consumption.freshnessScore) return b.consumption.freshnessScore - a.consumption.freshnessScore;
    return a.sourceId < b.sourceId ? -1 : (a.sourceId > b.sourceId ? 1 : 0);
  }

  function detectOverlaps(signals, intent) {
    var buckets = {};
    var order = [];
    signals.forEach(function (s) {
      var k = familyBucketKey(s);
      if (!buckets[k]) { buckets[k] = []; order.push(k); }
      buckets[k].push(s);
    });
    var result = [];
    order.forEach(function (k) {
      var members = buckets[k];
      if (members.length < 2) return;
      var parent = members.map(function (_, i) { return i; });
      function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
      function union(i, j) { var ri = find(i), rj = find(j); if (ri !== rj) parent[ri] = rj; }
      for (var i = 0; i < members.length; i++) {
        for (var j = i + 1; j < members.length; j++) {
          if (qualifiersCompatible(members[i].qualifiers, members[j].qualifiers)) union(i, j);
        }
      }
      var clusters = {};
      members.forEach(function (m, i) { var r = find(i); (clusters[r] = clusters[r] || []).push(m); });
      Object.keys(clusters).sort().forEach(function (r) {
        var members2 = clusters[r];
        if (members2.length < 2) return;
        var sorted = members2.slice().sort(primarySelectionComparator);
        var memberIds = members2.map(function (m) { return m.id; }).sort();
        result.push({
          group: freezeShallow({ id: 'GROUP:' + k + ':' + memberIds.join(','), type: 'OVERLAP', primarySignalId: sorted[0].id, memberSignalIds: freezeShallow(memberIds), reason: 'COMPATIBLE_QUALIFIERS' }),
          primaryId: sorted[0].id, memberIds: memberIds
        });
      });
    });
    return result;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Stable Sort (B5 §23.6) ──
  // ══════════════════════════════════════════════════════════════════
  function stableSort(signals) {
    return signals.slice().sort(function (a, b) {
      if (a.consumption.relevanceScore !== b.consumption.relevanceScore) return b.consumption.relevanceScore - a.consumption.relevanceScore;
      if (a.confidence !== b.confidence) return b.confidence - a.confidence;
      if (a.consumption.freshnessScore !== b.consumption.freshnessScore) return b.consumption.freshnessScore - a.consumption.freshnessScore;
      if (a.evidence.count !== b.evidence.count) return b.evidence.count - a.evidence.count;
      if (a.sourceType !== b.sourceType) return a.sourceType < b.sourceType ? -1 : 1;
      return a.sourceId < b.sourceId ? -1 : (a.sourceId > b.sourceId ? 1 : 0);
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Limits/Truncation (B5 §52) ──
  // ══════════════════════════════════════════════════════════════════
  function applyLimits(ordered, policy, requestedLimits) {
    requestedLimits = requestedLimits || {};
    var maxSignals = Math.min((typeof requestedLimits.maxSignals === 'number') ? requestedLimits.maxSignals : policy.maxSignals, policy.maxSignals);
    var maxHabits = Math.min((typeof requestedLimits.maxHabits === 'number') ? requestedLimits.maxHabits : policy.maxHabits, policy.maxHabits);
    var maxPatterns = Math.min((typeof requestedLimits.maxPatterns === 'number') ? requestedLimits.maxPatterns : policy.maxPatterns, policy.maxPatterns);
    var habitCount = 0, patternCount = 0;
    var limited = [];
    var truncated = false;
    var clamped = (typeof requestedLimits.maxSignals === 'number' && requestedLimits.maxSignals > policy.maxSignals) ||
      (typeof requestedLimits.maxHabits === 'number' && requestedLimits.maxHabits > policy.maxHabits) ||
      (typeof requestedLimits.maxPatterns === 'number' && requestedLimits.maxPatterns > policy.maxPatterns);
    for (var i = 0; i < ordered.length; i++) {
      var s = ordered[i];
      if (limited.length >= maxSignals) { truncated = true; continue; }
      if (s.sourceType === 'HABIT') {
        if (habitCount >= maxHabits) { truncated = true; continue; }
        habitCount++;
      } else {
        if (patternCount >= maxPatterns) { truncated = true; continue; }
        patternCount++;
      }
      limited.push(s);
    }
    return { limited: limited, truncated: truncated, clamped: clamped, habitCount: habitCount, patternCount: patternCount };
  }

  // ══════════════════════════════════════════════════════════════════
  // ── build(request) — B5 §50 Reference Algorithm ──
  // ══════════════════════════════════════════════════════════════════
  async function build(request) {
    try {
      var structErr = validateRequest(request);
      if (structErr === '__UNKNOWN_CONSUMER__') return rejected('UNKNOWN_CONSUMER', 'consumer not recognized');
      if (structErr === '__UNKNOWN_DOMAIN__') return rejected('UNKNOWN_DOMAIN', 'intent.domain not recognized');
      if (structErr) return rejected('INVALID_REQUEST', structErr);

      var resolved = resolvePolicy(request.consumer, request.policyId);
      if (resolved.error) return rejected(resolved.error, resolved.error + ' for ' + request.consumer + '/' + request.policyId);
      var policy = resolved.policy;

      var now = deps.getLocalDate ? deps.getLocalDate() : null;
      if (!isNonEmptyString(now)) return failed('CONTEXT_BUILD_FAILED', 'no canonical local date provider configured');

      if (!isCurrent(request.session.generation)) return staleSession();

      var rawHabit, rawPattern;
      try {
        rawHabit = await deps.readHabitSnapshot(request.session);
        rawPattern = await deps.readPatternSnapshot(request.session);
      } catch (e) {
        return failed('STATE_ACCESS_UNAVAILABLE', (e && e.message) || 'state access failed');
      }

      if (!isCurrent(request.session.generation)) return staleSession();

      var habitSnap = buildHabitSnapshot(rawHabit);
      var patternSnap = buildPatternSnapshot(rawPattern);

      var warnings = [];
      var exclusions = [];
      var candidates = [];

      if (habitSnap.availability === 'UNAVAILABLE' || habitSnap.availability === 'INVALID') warnings.push('HABIT_VIEW_INVALID');
      if (patternSnap.availability === 'UNAVAILABLE' || patternSnap.availability === 'INVALID') warnings.push('PATTERN_VIEW_INVALID');

      var habitNorm = habitSnap.durableAligned ? habitSnap.records.map(function (r) { return normalizeHabitRecord(r, habitSnap.meta, habitSnap.producerVersion); }) : [];
      var patternNorm = patternSnap.durableAligned ? patternSnap.records.map(function (r) { return normalizePatternRecord(r, patternSnap.meta, patternSnap.producerVersion, patternSnap.sourceFingerprint); }) : [];

      var deduped = resolveDuplicates(habitNorm.concat(patternNorm));
      deduped.forEach(function (item) {
        if (item.excluded) exclusions.push(item.excluded);
        else candidates.push(item.signal);
      });

      var included = [];
      candidates.forEach(function (signal) {
        var elig = evaluateEligibility(signal, policy, now);
        signal.consumption.freshnessScore = elig.freshnessScore;
        if (!elig.eligible) { exclusions.push({ sourceType: signal.sourceType, sourceId: signal.sourceId, codes: elig.codes }); return; }
        var rel = evaluateRelevance(signal, request.intent);
        if (!rel.relevant) { exclusions.push({ sourceType: signal.sourceType, sourceId: signal.sourceId, codes: rel.codes }); return; }
        var comps = rel.scoreComponents;
        signal.consumption.relevanceScore = round3((comps.topicComponent + comps.temporalComponent + comps.sequenceComponent + elig.freshnessScore) / 4);
        signal.consumption.inclusionReasons = freezeShallow(['CONFIDENCE_PASSED', 'EVIDENCE_PASSED', 'FRESHNESS_PASSED', signal.lifecycle === 'ACTIVE' ? 'ACTIVE_LIFECYCLE' : 'CONFIRMED_LIFECYCLE'].concat(rel.reasons));
        included.push(signal);
      });

      var contradictions = detectContradictions(included);
      if (!policy.includeUnresolvedContradictions && contradictions.length) {
        var contradicted = {};
        contradictions.forEach(function (c) { c.signalIds.forEach(function (id) { contradicted[id] = true; }); });
        var afterContradiction = [];
        included.forEach(function (s) {
          if (contradicted[s.id]) { exclusions.push({ sourceType: s.sourceType, sourceId: s.sourceId, codes: ['UNRESOLVED_CONTRADICTION'] }); warnings.push('UNRESOLVED_CONTRADICTION'); }
          else afterContradiction.push(s);
        });
        included = afterContradiction;
      }

      var overlapResult = detectOverlaps(included, request.intent);
      var groups = overlapResult.map(function (g) { return g.group; });
      var suppressedByOverlap = {};
      overlapResult.forEach(function (g) {
        g.memberIds.forEach(function (id) { if (id !== g.primaryId) suppressedByOverlap[id] = true; });
      });
      var afterOverlap = included.filter(function (s) {
        if (suppressedByOverlap[s.id]) return false;
        return true;
      });
      afterOverlap.forEach(function (s) {
        if (overlapResult.some(function (g) { return g.primaryId === s.id; })) {
          s.consumption.inclusionReasons = freezeShallow(s.consumption.inclusionReasons.concat(['PRIMARY_OVERLAP_SIGNAL']));
        }
      });

      var ordered = stableSort(afterOverlap);
      var limitResult = applyLimits(ordered, policy, request.limits);
      if (limitResult.clamped) warnings.push('REQUEST_LIMIT_CLAMPED');
      if (limitResult.truncated) warnings.push('DERIVED_CONTEXT_TRUNCATED');

      if (!isCurrent(request.session.generation)) return staleSession();

      // freeze consumption (relevanceScore/freshnessScore/inclusionReasons) רק עכשיו — היה
      // מוטציה מכוונת דרך שלבי ה-pipeline (eligibility/relevance); מהנקודה הזו ואילך הסיגנל
      // בלתי-ניתן-לשינוי כולו (B5 §30.4 immutability / Session and Immutability test matrix).
      var finalSignals = limitResult.limited.map(function (s) {
        s.consumption = freezeShallow(s.consumption);
        return freezeShallow(s);
      });
      var context = freezeShallow({
        schemaVersion: SCHEMA_VERSION, requestId: request.requestId, consumer: request.consumer, policyId: resolved.policyId,
        session: freezeShallow({ generation: request.session.generation }),
        builtAt: Date.now(),
        sourceStatus: freezeShallow({ habits: habitSnap.availability, patterns: patternSnap.availability }),
        signals: freezeShallow(finalSignals),
        groups: freezeShallow(groups),
        contradictions: freezeShallow(contradictions),
        summary: freezeShallow({
          includedCount: finalSignals.length, habitCount: limitResult.habitCount, patternCount: limitResult.patternCount,
          excludedCount: exclusions.length, truncated: limitResult.truncated
        }),
        diagnostics: freezeShallow({
          warnings: freezeShallow(warnings),
          exclusions: policy.includeDetailedDiagnostics ? freezeShallow(exclusions.map(function (e) { return freezeShallow(e); })) : undefined
        })
      });

      var sourceIssue = warnings.indexOf('HABIT_VIEW_INVALID') !== -1 || warnings.indexOf('PATTERN_VIEW_INVALID') !== -1;
      var status = sourceIssue ? 'PARTIAL' : (finalSignals.length ? 'SUCCESS' : 'EMPTY');
      return freezeShallow({ status: status, context: context, error: null });
    } catch (e) {
      return failed('CONTEXT_BUILD_FAILED', (e && e.message) || 'unexpected build failure');
    }
  }

  // B5 v1.2 §41.2/§42.3/§51.4: production-safe adapter. Rejects any consumer/policyId not in
  // the production-enabled mapping BEFORE invoking the core build() — this is the canonical
  // enforcement mechanism keeping TEST_HARNESS/TEST_FULL_DIAGNOSTIC_V1 (and any other
  // non-production consumer, e.g. RECOMMENDATION_ENGINE) unreachable from window/production UI.
  var PRODUCTION_ENABLED_MAPPING = freezeShallow({ AI_COACH_PROMPT: 'COACH_PROMPT_V1' });
  async function buildProductionSafe(request) {
    var consumer = request && request.consumer;
    var policyId = request && request.policyId;
    if (!consumer || !policyId || PRODUCTION_ENABLED_MAPPING[consumer] !== policyId) {
      return rejected('POLICY_NOT_ALLOWED_FOR_CONSUMER', 'consumer/policy not available on the production adapter');
    }
    return build(request);
  }

  var API = {
    build: build,
    configure: configure,
    CONSUMERS: freezeShallow(CONSUMERS.slice()),
    ENABLED_CONSUMERS: freezeShallow(ENABLED_CONSUMERS.slice()),
    DOMAINS: freezeShallow(DOMAINS.slice()),
    TOPICS: freezeShallow(TOPICS.slice()),
    CONTEXT_EVENTS: freezeShallow(CONTEXT_EVENTS.slice()),
    POLICIES: freezeShallow(Object.keys(POLICIES)),
    ERROR_CODES: API_ERROR_CODES,
    SCHEMA_VERSION: SCHEMA_VERSION,
    // exposed for the Node test runner only — never attached to window (below) — so the
    // production-safe wrapper itself can be verified.
    buildProductionSafe: buildProductionSafe,
    PRODUCTION_ENABLED_MAPPING: PRODUCTION_ENABLED_MAPPING
  };

  // The production browser global exposes ONLY the production-safe adapter (build routed
  // through buildProductionSafe, plus configure and closed vocabularies). The complete core
  // module — full ENABLED_CONSUMERS/POLICIES, including TEST_HARNESS/TEST_FULL_DIAGNOSTIC_V1 —
  // is available exclusively through the Node module export below, never through window.
  var PRODUCTION_SAFE_API = freezeShallow({
    build: buildProductionSafe,
    configure: configure,
    DOMAINS: API.DOMAINS,
    TOPICS: API.TOPICS,
    CONTEXT_EVENTS: API.CONTEXT_EVENTS,
    ERROR_CODES: API_ERROR_CODES,
    SCHEMA_VERSION: SCHEMA_VERSION
  });

  if (typeof window !== 'undefined') { window.DerivedIntelligenceConsumer = PRODUCTION_SAFE_API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
