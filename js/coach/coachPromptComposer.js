// ══════════════════════════════════════════════════════════════════
// FitMe — Coach Prompt Composer (C1-WP6, Coach and Prompt Composition)
// אחריות בלעדית: הרכבת הוראת המערכת של המאמן (זהות/אופי/אורך + זיכרון +
// B5 Derived Intelligence), תבניות "coach-line" מקומיות (בלי AI), והרכבת
// הקשר כרטיס המאמן במסך הבית. תלוי ישירות ב-CoachProfile (מודול טהור,
// אין סיכון override-chain — אותו דפוס כמו js/nutrition/mealCommitService.js
// התלוי ב-mealDraft.js) וב-DateUtils/DerivedIntelligenceConsumer/
// DerivedIntelligencePrompt (מודולים יציבים B1/B5, ללא override chain).
// אינו מבצע בקשת AI בעצמו (coachClient.js) ואינו נוגע ב-DOM (coachPresenter.js).
// buildSystemPrompt() מאחד את שתי השכבות ההיסטוריות שהיו קיימות ב-app.js
// (ההגדרה הבסיסית הסינכרונית + ה-override האסינכרוני שהזריק את B5) לפונקציה
// אחת — אותה התנהגות סופית בדיוק (ר' tests/coachPromptComposer.test.js
// להשוואה ישירה מול ה-app.js המקורי), רק ללא שכבת ה-wrapping הפנימית
// שהייתה פרט מימוש היסטורי. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP6.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CoachProfile = (typeof module !== 'undefined' && module.exports)
    ? require('./coachProfile.js')
    : window.CoachProfile;
  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;
  var DerivedIntelligenceConsumer = (typeof module !== 'undefined' && module.exports)
    ? require('../derivedIntelligenceConsumer.js')
    : window.DerivedIntelligenceConsumer;
  var DerivedIntelligencePrompt = (typeof module !== 'undefined' && module.exports)
    ? require('../derivedIntelligencePrompt.js')
    : window.DerivedIntelligencePrompt;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // זהה לחלוטין למקור.
  var COACH_STYLE_GUIDE = {
    friendly: 'דבר בטון חם, יומיומי וקליל, כמו חבר טוב. מותר הומור עדין.',
    supportive: 'דבר בטון תומך, מעודד ורגיש. שים דגש על חיזוק והבנה.',
    professional: 'דבר בטון ענייני, מדויק וממוקד. בלי סלנג, בלי קישוטים מיותרים.',
    mixed: 'שלב חום ידידותי עם דיוק ענייני — נעים אבל לא מתחנחן.'
  };
  var COACH_CHATTER_GUIDE = {
    minimal: 'משפט אחד קצר בלבד. בלי פתיח, בלי סיכום. רק העיקר.',
    balanced: 'עד 2 משפטים. נעים וקולע.',
    gentle: '2–3 משפטים חמים ומלווים, עם מילת עידוד אמיתית.'
  };

  // הוראת מערכת קצרה שמרכיבה את הדמות מההעדפות — זהה לחלוטין ל-buildCoachSystemPrompt()
  // המקורי (השכבה הבסיסית, לפני הזרקת B5). goalLabels מוזרק (קבוע משותף עם domains אחרים).
  function buildBasePrompt(userProfile) {
    var p = userProfile || {};
    var f = [];
    if (p.gender) f.push('מין: ' + (p.gender === 'male' ? 'זכר' : 'נקבה'));
    if (p.age) f.push('גיל: ' + p.age);
    var w = p.currentWeight || p.weight;
    if (w) f.push('משקל: ' + w + ' ק"ג');
    if (p.height) f.push('גובה: ' + p.height + ' ס"מ');
    if (p.goal) f.push('מטרה: ' + (deps.goalLabels[p.goal] || p.goal));
    if (p.goalKcal) f.push('יעד קלוריות יומי: ' + p.goalKcal);
    if (p.days) { var dm = { '2': '2-3', '4': '4-5', '6': '6+' }; f.push('ימי אימון בשבוע: ' + (dm[p.days] || p.days)); }
    if (p.workoutType) f.push('סוג אימון מועדף: ' + p.workoutType);
    if (Array.isArray(p.foods) && p.foods.length) f.push('מאכלים אהובים: ' + p.foods.join(', '));
    if (p.streak) f.push('סטריק נוכחי: ' + p.streak + ' ימים');
    return [
      'אתה "המאמן" — נוכחות אישית באפליקציית תזונה וכושר בשם FitMe.',
      'אתה מדבר עברית בלבד, בגוף ראשון, ופונה למשתמש בשם: ' + CoachProfile.coachName(userProfile) + '.',
      f.length ? ('הכר את מי שאתה מלווה — ' + f.join(' · ') + '. התאם את דבריך למצב ולמטרה שלו, אך אל תדקלם את הנתונים אלא אם הם רלוונטיים להודעה.') : '',
      'אופי: ' + (COACH_STYLE_GUIDE[CoachProfile.coachStyle(userProfile)] || COACH_STYLE_GUIDE.mixed),
      'אורך: ' + (COACH_CHATTER_GUIDE[CoachProfile.coachChatter(userProfile)] || COACH_CHATTER_GUIDE.balanced),
      'לעולם אל תמציא נתונים שלא נמסרו לך. אל תשתמש בכותרות, רשימות או Markdown — טקסט רץ בלבד.',
      'אל תפתח ב"שלום" חוזר בכל הודעה. היה טבעי.'
    ].filter(Boolean).join(' ');
  }

  // ניסוח קצר של הזיכרון לתוך הוראת המערכת — זהה לחלוטין ל-coachMemoryPromptFragment() המקורי.
  function coachMemoryFragment(userProfile) {
    var m = userProfile && userProfile.coachMemory;
    if (!m) return '';
    var parts = [];
    if (Array.isArray(m.observations) && m.observations.length) {
      var obs = m.observations.slice(-8).map(function (o) { return (o && o.text) || o; }).filter(Boolean);
      if (obs.length) parts.push('מה שלמדתי עליו עד כה: ' + obs.join('; ') + '.');
    }
    if (m.preferences && Object.keys(m.preferences).length) {
      var pref = Object.entries(m.preferences).map(function (kv) { return kv[0] + ': ' + kv[1]; }).join('; ');
      if (pref) parts.push('העדפות שנלמדו: ' + pref + '.');
    }
    return parts.join(' ');
  }

  // טקסט מקומי (בלי רשת) לפי אופי — זהה לחלוטין ל-coachLine() המקורי.
  function coachLine(userProfile, kind, d) {
    var n = CoachProfile.coachName(userProfile);
    var warm = CoachProfile.coachChatter(userProfile) === 'gentle';
    var pro = CoachProfile.coachStyle(userProfile) === 'professional' || CoachProfile.coachChatter(userProfile) === 'minimal';
    var T = {
      morning:   pro ? ('בוקר טוב. יעד היום: ' + d.goal + ' קל׳.') : warm ? ('בוקר טוב ' + n + ' ☀️ יום חדש, הזדמנות חדשה. היעד שלך היום: ' + d.goal + ' קל׳.') : ('בוקר טוב ' + n + '! היעד שלך היום: ' + d.goal + ' קל׳.'),
      protein:   pro ? ('חלבון: ' + d.have + 'g מתוך ' + d.target + 'g.') : warm ? (n + ', שים לב לחלבון — ' + d.have + 'g מתוך ' + d.target + 'g. ביצה, עוף או קוטג׳ יסגרו את הפער יפה.') : ('חסר קצת חלבון: ' + d.have + 'g מתוך ' + d.target + 'g. אולי ביצים או קוטג׳?'),
      evening:   pro ? ('נותרו ' + d.remain + ' קל׳ להיום.') : warm ? (n + ', יש לך עוד זמן — נותרו ' + d.remain + ' קל׳ להיום, אתה בכיוון טוב.') : (n + ', נותרו ' + d.remain + ' קל׳ להיום. תספיק!'),
      streak:    pro ? ('סטריק ' + d.streak + ' ימים — טרם נרשמה ארוחה היום.') : warm ? (n + ', הסטריק היפה שלך (' + d.streak + ' ימים) מחכה — רישום קטן אחד וזה נשמר 🔥') : ('אל תשבור את הסטריק! ' + d.streak + ' ימים בסכנה — רשום משהו 🔥'),
      achieve:   pro ? ('הישג חדש: ' + d.title + '.') : warm ? (n + ', כל הכבוד! פתחת הישג: ' + d.title + ' ' + d.icon) : ('הישג חדש ' + d.icon + ' — ' + d.title + '!'),
      workout:   pro ? ('אימון נשמר. ' + d.burn + ' קל׳.') : warm ? (n + ', אלוף! אימון נשמר ושרפת ' + d.burn + ' קל׳ 💪') : ('אימון נשמר! שרפת ' + d.burn + ' קל׳ 💪')
    };
    return T[kind] || '';
  }

  // הקשר כרטיס המאמן במסך הבית — זהה לחלוטין לבניית ה-ctx בתוך refreshCoachCard() המקורי.
  function composeHomeCardContext(todayData, userProfile) {
    var consumed = todayData.meals.reduce(function (s, m) { return s + (m.kcal || 0); }, 0);
    var protein = Math.round(todayData.meals.reduce(function (s, m) { return s + (m.protein || 0); }, 0));
    var targetProtein = Math.round((userProfile.weight || 75) * 1.8);
    var remain = Math.max(0, userProfile.goalKcal - consumed);
    var hour = new Date().getHours();
    var partOfDay = hour < 11 ? 'בוקר' : hour < 17 ? 'צהריים' : 'ערב';
    return 'עכשיו ' + partOfDay + '. ' + CoachProfile.coachName(userProfile) + ' פתח את מסך הבית. צרך ' + consumed + ' קל׳ מתוך ' + userProfile.goalKcal + ' (נותרו ' + remain + '). חלבון ' + protein + 'g מתוך ' + targetProtein + 'g. סטריק ' + (userProfile.streak || 0) + ' ימים. מטרה: ' + deps.goalLabels[userProfile.goal] + '. תן משפט מלווה שמתאים לשעה ולמצב — עידוד או טיפ קטן.';
  }

  function timeSegment(h) {
    if (h >= 5 && h < 11) return 'MORNING';
    if (h >= 11 && h < 16) return 'MIDDAY';
    if (h >= 16 && h < 22) return 'EVENING';
    return 'NIGHT';
  }

  function contextEvents(todayData, userProfile) {
    var events = [];
    var today = DateUtils.getTodayKey();
    if (todayData && todayData.burned > 0) events.push('WORKOUT_COMPLETED');
    if (todayData && Array.isArray(todayData.meals) && todayData.meals.length) events.push('MEAL_LOGGED');
    if (userProfile && Array.isArray(userProfile.weightHistory) && userProfile.weightHistory.some(function (w) { return w.date === today; })) events.push('WEIGH_IN_RECORDED');
    if (userProfile && Array.isArray(userProfile.measurementHistory) && userProfile.measurementHistory.some(function (m) { return m.date === today; })) events.push('MEASUREMENT_RECORDED');
    return events;
  }

  // הוראת המערכת הסופית — מאחדת את buildBasePrompt + coachMemoryFragment + B5 Derived
  // Intelligence (Habit/Pattern), דרך derivedIntelligenceConsumer.js — הצרכן היחיד המאושר
  // בפועל של Habit/Pattern Derived Intelligence Views לפרומפט המאמן (B5 §12.3:
  // AI_COACH_PROMPT/COACH_PROMPT_V1). כשל כלשהו ב-B5 (state access/session/build) לעולם
  // לא חוסם את הפרומפט — B5 הוא מקור תוספתי בלבד, לא תלות קריטית (SPEC §19.5 session
  // safety / graceful degradation). זהה לחלוטין להתנהגות המצטברת של שתי השכבות שהיו
  // קיימות ב-app.js (הבסיס הסינכרוני + ה-override האסינכרוני).
  async function buildSystemPrompt(userProfile, todayData, currentUser) {
    var base = buildBasePrompt(userProfile);
    var mem = coachMemoryFragment(userProfile);
    var derived = '';
    try {
      if (currentUser && currentUser.uid) {
        var now = new Date();
        var result = await DerivedIntelligenceConsumer.build({
          requestId: 'coach-prompt-' + Date.now(),
          consumer: 'AI_COACH_PROMPT',
          policyId: 'COACH_PROMPT_V1',
          session: { uid: currentUser.uid, generation: deps.sessionLifecycle.getGeneration() },
          intent: {
            domain: 'GENERAL_COACHING',
            purpose: 'IMMEDIATE',
            weekday: now.getDay(),
            localTimeSegment: timeSegment(now.getHours()),
            contextEvents: contextEvents(todayData, userProfile)
          }
        });
        if (result && (result.status === 'SUCCESS' || result.status === 'PARTIAL')) {
          derived = DerivedIntelligencePrompt.project(result.context);
        }
      }
    } catch (e) { /* B5 תוספתי בלבד — לעולם לא חוסם את הפרומפט */ }
    var withMem = mem ? (base + ' ' + mem) : base;
    return derived ? (withMem + ' ' + derived) : withMem;
  }

  var API = {
    configure: configure,
    buildBasePrompt: buildBasePrompt,
    coachMemoryFragment: coachMemoryFragment,
    coachLine: coachLine,
    composeHomeCardContext: composeHomeCardContext,
    buildSystemPrompt: buildSystemPrompt
  };

  if (typeof window !== 'undefined') { window.CoachPromptComposer = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
