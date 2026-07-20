// ══════════════════════════════════════════════════════════════════
// FitMe — Nutrition AI Analysis Service (C1-WP5A, Nutrition Application Domain)
// אחריות בלעדית: בניית בקשות ה-AI לניתוח תזונתי (שאלון, חישוב, ניתוח
// תמונה/תווית, הערכת פריט בודד בעורך) ו-ניתוב תוצאת אימות (REM-001).
// אינו יודע דבר על DOM/foodSession/pendingMeal/UI בפועל — אלה נשארים
// באחריות המזמין (js/app.js). מודלים, token limits, טקסט הפרומפטים
// וסכמת ה-JSON, סוגי המקור (source types), ונקודות האימות (validation
// checkpoints) זהים לחלוטין לקוד המקורי — שום שינוי התנהגות. חולץ
// מ-js/app.js — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP5A.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  var ITEMS_JSON_SPEC = '{"name":"שם המנה בעברית","items":[{"name":"רכיב","amount":150,"unit":"גרם","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}],"suggestions":[{"name":"תוספת","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}],"note":"הערה קצרה על בסיס ההערכה"}';

  var PLATE_PROMPT = 'זהה כל פריט מאכל בצלחת בנפרד — כל רכיב בשורה משלו עם הערכת כמות (גרם/יחידות/כפות) וערכים תזונתיים משלו. אל תאחד הכל לשורה אחת.\nב-suggestions כלול 2-4 "קלוריות נסתרות" שהמצלמה לא רואה אבל אופייניות למנה כזו (שמן בבישול/בטיגון, גבינה מגוררת, רוטב, חמאה) — עם ערכים לכמות טיפוסית.\nsodium במ"ג, השאר בגרם. אם התמונה לא ברורה ציין זאת ב-note. חשוב: החזר JSON תקין בלבד — בלי שום טקסט, הסבר או הקדמה לפני או אחרי ה-JSON. התו הראשון בתשובה חייב להיות { והתו האחרון }. המבנה: ';

  var LABEL_PROMPT = 'בתמונה תווית ערכים תזונתיים של מוצר מזון. קרא את הטבלה בזהירות והחזר פריט אחד מדויק.\nכללים מחייבים:\n1. קרא קודם את משקל הנטו של המוצר (מופיע כ"משקל נטו" / "תכולה"). זו הכמות של מנה שלמה.\n2. בטבלה יש לרוב שתי עמודות: "ל-100 גרם" ו"למנה"/"ליחידה". קח את כל הערכים מ*אותה עמודה בלבד* — אל תערבב בין העמודות. העדף את עמודת המנה (לפי משקל הנטו). אם קיימת רק עמודת 100 גרם — השתמש בה וציין זאת ב-note.\n3. amount = הכמות בגרם של הבסיס שבחרת (למשל משקל הנטו), unit = "גרם". name = שם המוצר אם מופיע, אחרת "מוצר מהתווית".\n4. sodium במ"ג. אם רשום רק מלח: נתרן(מ"ג) = מלח(גרם) ÷ 2.5 × 1000.\n5. בדיקה עצמית לפני החזרה: חומצות שומן רוויות ≤ שומן כולל; סוכר ≤ פחמימות; והקלוריות בערך שוות ל: חלבון×4 + פחמימות×4 + שומן×9. אם משהו לא מסתדר — קרא שוב את הטבלה ותקן.\n6. ב-note ציין על איזה בסיס חושבו הערכים (כמה גרם).\nsuggestions = מערך ריק. אם התווית לא קריאה החזר {"error":"לא קריא"}. חשוב: החזר JSON תקין בלבד — בלי שום טקסט, הסבר או הקדמה לפני או אחרי ה-JSON. התו הראשון בתשובה חייב להיות { והתו האחרון }. המבנה: ';

  // בניית בקשת השאלון — זהה לחלוטין לתוכן ולפרומפט המקוריים ב-analyzeFood().
  async function requestQuestionnaire(input) {
    var data = await deps.callClaude({
      model: 'claude-sonnet-4-6', max_tokens: 600, messages: [{ role: 'user', content: 'המשתמש רשם: "' + input + '". צור שאלון קצר לחישוב תזונתי מדויק. החזר JSON בלבד:\n{"questions":[{"q":"שאלה בעברית","options":["אפשרות 1","אפשרות 2","אפשרות 3"]}]}\nכללים חשובים:\n- אם זו מנה מורכבת מכמה רכיבים (כמו פסטה ברוטב, אורז עם עוף, כריך) — השאלות חייבות לברר את הכמות של כל רכיב מרכזי בנפרד (למשל: "כמה ספגטי?" ו"כמה רוטב בשר?"), לא רק "גודל מנה" כללי.\n- אפשרויות הכמות חייבות להיות מוחשיות: גרמים, כפות, כוסות, יחידות ("צלחת קטנה ~150 גרם").\n- אם רלוונטי, שאל על סוג (בשר בקר/הודו) או שיטת בישול (מטוגן/אפוי).\n- עד 3 שאלות. אל תשאל על מה שכבר ברור מהטקסט. אל תוסיף טקסט מחוץ ל-JSON.' }]
    });
    return deps.parseModelJSON(data.content[0].text);
  }

  // בניית בקשת החישוב — זהה לחלוטין ל-calculateFoodResult() המקורי, כולל ITEMS_JSON_SPEC.
  async function requestCalculation(originalInput, answersText) {
    var data = await deps.callClaude({
      model: 'claude-sonnet-4-6', max_tokens: 1200, messages: [{ role: 'user', content: 'חשב ערכים תזונתיים: מאכל: "' + originalInput + '", פרטים: ' + answersText + '.\nפרק את המנה לרכיבים נפרדים (כל רכיב בשורה משלו עם כמות וערכים משלו). ב-suggestions כלול 2-4 "קלוריות נסתרות" אופייניות למנה כזו שהמשתמש אולי שכח (שמן בבישול, גבינה מגוררת, לחם ליד, רוטב) — עם ערכים לכמות טיפוסית. sodium במ"ג, השאר בגרם. החזר JSON בלבד במבנה: ' + ITEMS_JSON_SPEC }]
    });
    return deps.parseModelJSON(data.content[0].text);
  }

  // בחירת פרומפט צלחת/תווית — זהה לחלוטין ל-analyzePhoto() המקורי (mode==='label' ? LABEL_PROMPT : PLATE_PROMPT).
  async function requestPhotoAnalysis(mode, imageB64, mediaType) {
    var promptText = (mode === 'label' ? LABEL_PROMPT : PLATE_PROMPT) + ITEMS_JSON_SPEC;
    var data = await deps.callClaude({
      model: 'claude-sonnet-4-6', max_tokens: 1200, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageB64 } }, { type: 'text', text: promptText }] }]
    });
    return deps.parseModelJSON(data.content[0].text);
  }

  // הערכת פריט בודד בעורך — זהה לחלוטין ל-editorAddCustom() המקורי.
  async function requestItemEstimate(description) {
    var data = await deps.callClaude({
      model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: 'הערך תזונתית פריט בודד: "' + description + '". אם לא צוינה כמות הנח כמות טיפוסית. sodium במ"ג, השאר בגרם. החזר JSON בלבד: {"name":"שם","amount":0,"unit":"גרם","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}' }]
    });
    return deps.parseModelJSON(data.content[0].text);
  }

  // ניתוב אימות (REM-001 §15/ER-001) — זהה לחלוטין ל-routeAiMeal() המקורי: שער ראשון מיד
  // אחרי parseModelJSON, לפני שהעורך נפתח בכלל. onRejected/onValid מוזרקים (UI, WP5C טרם חולץ).
  function routeMeal(meal, sourceType, retryFn) {
    var items = (meal && Array.isArray(meal.items)) ? meal.items : [];
    var gate = deps.nutritionOutputValidator.validateNutritionMeal(items, sourceType);
    deps.logValidation(gate.overallStatus, sourceType, deps.collectErrorCodes(gate));
    if (gate.overallStatus === 'REJECTED') { deps.onRejected(retryFn, meal); return; }
    deps.onValid(meal);
  }

  var API = {
    configure: configure,
    requestQuestionnaire: requestQuestionnaire,
    requestCalculation: requestCalculation,
    requestPhotoAnalysis: requestPhotoAnalysis,
    requestItemEstimate: requestItemEstimate,
    routeMeal: routeMeal,
    PLATE_PROMPT: PLATE_PROMPT,
    LABEL_PROMPT: LABEL_PROMPT,
    ITEMS_JSON_SPEC: ITEMS_JSON_SPEC
  };

  if (typeof window !== 'undefined') { window.NutritionAnalysisService = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
