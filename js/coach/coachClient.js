// ══════════════════════════════════════════════════════════════════
// FitMe — Coach Client (C1-WP6, Coach and Prompt Composition)
// אחריות בלעדית: בקשת הודעת מאמן בפועל — הרכבת גוף הבקשה (max_tokens לפי
// אורך-דיבור, system מ-CoachPromptComposer.buildSystemPrompt) וקריאה ל-AI
// דרך callClaude המוזרק (closure — callClaude עטוף מאוחר יותר ב-app.js
// למעקב שימוש, אותו דפוס בדיוק כמו js/nutrition/nutritionAnalysisService.js
// ב-WP5A). תלוי ישירות ב-CoachProfile וב-CoachPromptComposer (מודולי-אחות
// יציבים, ללא override chain משלהם — אותו דפוס כמו js/nutrition/
// mealCommitService.js התלוי ב-mealDraft.js). אינו מרכיב את הפרומפט בעצמו
// ואינו נוגע ב-DOM. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP6.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CoachProfile = (typeof module !== 'undefined' && module.exports)
    ? require('./coachProfile.js')
    : window.CoachProfile;
  var CoachPromptComposer = (typeof module !== 'undefined' && module.exports)
    ? require('./coachPromptComposer.js')
    : window.CoachPromptComposer;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // מייצר הודעת מאמן דרך ה-proxy — זהה לחלוטין ל-coachMessage() המקורי.
  async function sendMessage(context, userProfile, todayData, currentUser) {
    var systemPrompt = await CoachPromptComposer.buildSystemPrompt(userProfile, todayData, currentUser);
    var data = await deps.callClaude({
      model: 'claude-sonnet-4-6',
      max_tokens: CoachProfile.coachChatter(userProfile) === 'gentle' ? 220 : 120,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'המצב כרגע: ' + context + '\nכתוב הודעת מאמן אחת בהתאם לאופי ולאורך שהוגדרו.' }]
    });
    return (data.content && data.content[0] && data.content[0].text || '').trim();
  }

  var API = {
    configure: configure,
    sendMessage: sendMessage
  };

  if (typeof window !== 'undefined') { window.CoachClient = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
