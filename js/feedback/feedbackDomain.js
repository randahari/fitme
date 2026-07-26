// ══════════════════════════════════════════════════════════════════
// FitMe — Feedback Domain (C2, Rejection and Suppression Feedback)
// אחריות בלעדית: מודול utility טהור משותף — באותה שכבה ארכיטקטונית בדיוק
// כמו js/domain/profileMetrics.js / js/core/dateUtils.js / js/coach/coachProfile.js
// (utility משותף הנצרך ע"י כמה domains, לא Engine, לא נרשם ב-EngineRegistry).
// שתי אחריויות טהורות: (1) סיווג מחווה לאחד משמונת סוגי המשוב הקנוניים
// הסגורים (CD-04) — אין להוסיף קטגוריות; (2) חישוב דיכוי זמני והפיך,
// מחדש-מהמקור בכל קריאה (recompute-from-source, ללא מוטציה/state מאוחסן —
// CD-06), לפי מדיניות שחזור הנקראת-בשם וגרסתית (RECOVERY_POLICIES —
// אותו דפוס בדיוק כמו CONSUMER_POLICY/POLICIES ב-js/derivedIntelligenceConsumer.js,
// B5) כך שהחוזה הארכיטקטוני (§13, 4 הערבויות: CD-02/03/06/07) קבוע ונפרד
// מהאסטרטגיה המבצעית של policyId נתון (Issue 4). מודול טהור — ללא
// configure(), ללא DOM/פלטפורמה/AI/פרסיסטנס. נצרך הן ע"י Trigger
// (js/trigger/triggerController.js) והן ע"י Adaptive TDEE
// (js/adaptive/adaptiveTdeeController.js). ראה C2_SPEC v1.1 §8/§13,
// Appendix A (ברירות מחדל הנדסיות — לא מדיניות מוצר קנונית).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── CD-04: אוצר מילים סגור של סוגי משוב — קנוני, אין להוסיף קטגוריות ──
  var FEEDBACK_TYPES = ['Accepted', 'Completed', 'Dismissed', 'Rejected', 'Ignored', 'Expired', 'UserCorrected', 'UserConfirmed'];

  // מחווית UI -> סוג משוב קנוני (§6: מיפוי סגור, ללא בדאי חדש). מפתח = surface:gesture.
  var GESTURE_TYPE = {
    'trigger:dismiss': 'Dismissed',
    'adaptiveTdee:apply': 'Accepted',
    'adaptiveTdee:dismiss': 'Dismissed'
  };

  function classifyFeedback(surface, gesture) {
    var key = surface + ':' + gesture;
    var t = GESTURE_TYPE[key];
    if (!t) throw new Error('FeedbackDomain.classifyFeedback: unknown gesture ' + key);
    return t;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── §13: קטלוג מדיניות שחזור דיכוי, נקרא-בשם וגרסתי (Issue 4) ──
  // הערכים כאן הם ברירות מחדל הנדסיות (Appendix A — לא מדיניות מוצר
  // קנונית), מכוילים מול מוסכמות בית קיימות (COACH_DAILY_BUDGET=3,
  // MISS_INACTIVE_PERIODS=3, ADAPT_CADENCE_DAYS=7) וניתנים לכיול מחדש
  // ללא שינוי החתימה/החוזה של evaluateSuppression או קריאה כלשהי לו.
  // ══════════════════════════════════════════════════════════════════
  var RECOVERY_POLICIES = {
    SUPPRESSION_RECOVERY_POLICY_V1: {
      windowDays: 14,               // הנדסי — mirrors ADAPT_WINDOW_DAYS
      patternThreshold: 3,          // הנדסי — mirrors COACH_DAILY_BUDGET / MISS_INACTIVE_PERIODS
      suppressionDurationDays: 7,   // הנדסי — mirrors ADAPT_CADENCE_DAYS
      overrideTypes: ['Accepted', 'Completed', 'UserConfirmed'],
      negativeTypes: ['Dismissed', 'Rejected']
    }
  };
  var DEFAULT_POLICY_ID = 'SUPPRESSION_RECOVERY_POLICY_V1';

  function dayMs(n) { return n * 24 * 60 * 60 * 1000; }

  // פונקציה טהורה: מחשבת מחדש מהמקור (recompute-from-source) בכל קריאה —
  // ללא state מאוחסן/מוטציה כלשהי (CD-06). ארבע הערבויות הקנוניות (החוזה
  // הקבוע, §13):
  //  1. אירוע משוב בודד לעולם אינו מדכא באופן עצמאי (CD-02).
  //  2. הדיכוי תמיד זמני והפיך, לעולם לא ענישה/חסימה קבועה (CD-07).
  //  3. מצב הדיכוי תמיד מחושב מחדש מהמקור, לעולם לא flag שמור/מוטט (CD-06).
  //  4. פעולת משתמש חיובית מפורשת גוברת על עדות שלילית קודמת (CD-03/CD-07).
  function evaluateSuppression(feedbackEvents, surface, contextId, nowTs, policyId) {
    policyId = policyId || DEFAULT_POLICY_ID;
    var policy = RECOVERY_POLICIES[policyId];
    if (!policy) throw new Error('FeedbackDomain.evaluateSuppression: unknown policyId ' + policyId);

    var windowStart = nowTs - dayMs(policy.windowDays);
    var relevant = (feedbackEvents || []).filter(function (e) {
      return e && e.surface === surface && e.contextId === contextId &&
        typeof e.occurredAt === 'number' && e.occurredAt >= windowStart && e.occurredAt <= nowTs;
    }).sort(function (a, b) { return b.occurredAt - a.occurredAt; }); // חדש -> ישן

    if (!relevant.length) {
      return { suppressed: false, reason: 'no-evidence', suppressedUntil: null, policyId: policyId };
    }

    // ערבות 4: פעולה חיובית מפורשת עדכנית ביותר -> override מיידי (CD-03/CD-07)
    if (policy.overrideTypes.indexOf(relevant[0].feedbackType) >= 0) {
      return { suppressed: false, reason: 'explicit-positive-override', suppressedUntil: null, policyId: policyId };
    }

    var negatives = relevant.filter(function (e) { return policy.negativeTypes.indexOf(e.feedbackType) >= 0; });

    // ערבות 1: אירוע בודד לעולם אינו מדכא באופן עצמאי (CD-02)
    if (negatives.length < policy.patternThreshold) {
      return { suppressed: false, reason: 'insufficient-pattern', suppressedUntil: null, policyId: policyId };
    }

    var lastNegative = negatives[0];
    var until = lastNegative.occurredAt + dayMs(policy.suppressionDurationDays);
    // ערבות 2: הדיכוי זמני — פג אוטומטית (CD-07)
    if (until <= nowTs) {
      return { suppressed: false, reason: 'suppression-expired', suppressedUntil: null, policyId: policyId };
    }

    return { suppressed: true, reason: 'repeated-pattern', suppressedUntil: until, policyId: policyId };
  }

  var API = {
    FEEDBACK_TYPES: FEEDBACK_TYPES,
    RECOVERY_POLICIES: RECOVERY_POLICIES,
    DEFAULT_POLICY_ID: DEFAULT_POLICY_ID,
    classifyFeedback: classifyFeedback,
    evaluateSuppression: evaluateSuppression
  };

  if (typeof window !== 'undefined') { window.FeedbackDomain = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
