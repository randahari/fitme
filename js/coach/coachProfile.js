// ══════════════════════════════════════════════════════════════════
// FitMe — Coach Profile (C1-WP6, Coach and Prompt Composition)
// אחריות בלעדית: גישה לזהות/אופי/אורך-דיבור המאמן (coachName/coachStyle/
// coachChatter) — קריאה מ-userProfile עם ברירות מחדל, וכתיבה (setStyle/
// setChatter). מודול טהור — ללא configure(), ללא DOM/פלטפורמה/AI, באותו
// דפוס כמו js/nutrition/mealDraft.js. אינו מרכיב פרומפט (WP6's
// coachPromptComposer.js) ואינו מבצע בקשת AI (coachClient.js) או רינדור
// (coachPresenter.js). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP6.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // זהה לחלוטין ל-coachName()/coachStyle()/coachChatter() המקוריים.
  function coachName(userProfile) {
    return (userProfile && userProfile.coachName) || (userProfile && userProfile.name) || 'חבר';
  }
  function coachStyle(userProfile) { return (userProfile && userProfile.coachStyle) || 'mixed'; }
  function coachChatter(userProfile) { return (userProfile && userProfile.coachChatter) || 'balanced'; }

  // מוטציה במקום על userProfile הקיים — זהה לשורת ה-mutation שבתוך setCoachStyle/
  // setCoachChatter המקוריים (ה-guard/DOM/saveProfile נשארים אצל הקורא — coachPresenter.js).
  function setStyle(userProfile, v) { userProfile.coachStyle = v; }
  function setChatter(userProfile, v) { userProfile.coachChatter = v; }

  var API = {
    coachName: coachName,
    coachStyle: coachStyle,
    coachChatter: coachChatter,
    setStyle: setStyle,
    setChatter: setChatter
  };

  if (typeof window !== 'undefined') { window.CoachProfile = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
