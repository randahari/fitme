// ══════════════════════════════════════════════════════════════════
// FitMe — Derived Intelligence Prompt Projector (B5 §33)
// אחריות בלעדית: הפיכת DerivedIntelligenceContext (שכבר סונן ומדורג
// ע"י js/derivedIntelligenceConsumer.js) לפרגמנט טקסט עברי, זהיר
// בניסוח, חסום ב-8 פריטים / 1,200 תווים, ללא IDs/ציוני-ודאות/
// fingerprints פנימיים. פונקציה טהורה — אינה קוראת state, אינה
// תלויה ב-session, אינה כותבת. עותק עצמאי של שמות ימים/מקטעי-זמן,
// באותו עיקרון כמו שאר המנועים בקובץ זה (אין צימוד ל-app.js).
// ראה docs/tasks/B5/B5_SPEC_v1.0.md §33 (תוכן קנוני v1.1).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var MAX_ITEMS = 8;
  var MAX_CHARS = 1200;
  var HEADER = 'תובנות שנצפו בדפוסי השימוש שלך:';

  var WEEKDAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var SEGMENT_HE = { MORNING: 'הבוקר', MIDDAY: 'הצהריים', EVENING: 'הערב', NIGHT: 'הלילה' };

  // ניסוח זהיר, תלוי lifecycle (B5 §33.3): ACTIVE = דפוס מבוסס; CONFIRMED = מתגבש.
  // אין ניסוחים מוחלטים ("תמיד"/"עובדה"/"חייב") — רק "נוטה"/"יש נטייה"/"נראה ש".
  function hedge(lifecycle) {
    return lifecycle === 'ACTIVE' ? 'בדרך כלל, ' : 'נראה שלאחרונה, ';
  }

  function weekdayName(qualifiers) {
    for (var i = 0; i < qualifiers.length; i++) {
      var idx = WEEKDAY_HE.reduce(function (acc, name, wd) {
        return qualifiers[i] === 'ON_' + ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][wd] ? wd : acc;
      }, -1);
      if (idx !== -1) return WEEKDAY_HE[idx];
    }
    return null;
  }
  function segmentName(qualifiers) {
    for (var i = 0; i < qualifiers.length; i++) {
      if (SEGMENT_HE[qualifiers[i]]) return SEGMENT_HE[qualifiers[i]];
    }
    return null;
  }

  // labelKey (== sourceId, ר' derivedIntelligenceConsumer.js) -> בונה משפט עברי.
  // סט סגור, תואם 1:1 ל-HABIT_TYPE_DOMAIN/mapHabitTopic ו-PATTERN_ID_MAP במקור.
  // labelKey שלא מוכר לטבלה זו מדולג בשקט (B5 §53.3) — הסיגנל עדיין זמין
  // לצרכנים מובנים אחרים, רק לא מוצג בפרגמנט הטקסט.
  function habitSentence(signal) {
    var h = hedge(signal.lifecycle);
    var id = signal.sourceId;
    if (id.indexOf('nutrition:meal:') === 0) {
      var seg = segmentName(signal.qualifiers);
      return seg ? h + 'יש נטייה לתעד ארוחות ב' + seg : null;
    }
    if (id === 'nutrition:log-consistency') return h + 'יש נטייה לתעד ארוחות בעקביות';
    if (id.indexOf('workout:weekday:') === 0) {
      var wd = weekdayName(signal.qualifiers);
      return wd ? h + 'יש נטייה להתאמן בימי ' + wd : null;
    }
    if (id === 'weight:weigh-in') return h + 'יש נטייה לשקול את עצמך בקביעות';
    if (id === 'measurement:measure') return h + 'יש נטייה לתעד מדידות גוף בקביעות';
    return null;
  }

  function patternSentence(signal) {
    var h = hedge(signal.lifecycle);
    var id = signal.sourceId;
    switch (id) {
      case 'time.first_meal_window': return h + 'הארוחה הראשונה נוטה להיות בשעה קבועה';
      case 'time.last_meal_window': return h + 'הארוחה האחרונה נוטה להיות בשעה קבועה';
      case 'sequence.workout_day_high_protein': return h + 'בימי אימון יש נטייה לצריכת חלבון גבוהה יותר';
      case 'sequence.workout_back_to_back': return h + 'יש נטייה להתאמן בימים רצופים';
      case 'sequence.rest_after_workout': return h + 'יש נטייה לנוח ביום שאחרי אימון';
      case 'sequence.weigh_measure_together': return h + 'יש נטייה לשקול ולמדוד את הגוף באותו יום';
      case 'frequency.meals_per_day': return h + 'מספר הארוחות היומי נוטה להיות קבוע יחסית';
      case 'frequency.workouts_per_week': return h + 'תדירות האימונים השבועית נוטה להיות קבועה יחסית';
    }
    var wm = /^weekday\.(active|skip)\.([0-6])$/.exec(id);
    if (wm) {
      var wd = weekdayName(signal.qualifiers) || WEEKDAY_HE[+wm[2]];
      return wm[1] === 'active' ? h + 'יש נטייה לפעילות תזונתית ביום ' + wd : h + 'יש נטייה לדילוג על תיעוד ביום ' + wd;
    }
    return null;
  }

  function sentenceFor(signal) {
    if (signal.sourceType === 'HABIT') return habitSentence(signal);
    if (signal.sourceType === 'PATTERN') return patternSentence(signal);
    return null;
  }

  // project(context) — B5 §33: קלט הוא DerivedIntelligenceContext שכבר מדורג ע"י
  // derivedIntelligenceConsumer.build(). מחזיר מחרוזת עברית חסומה, או '' אם אין
  // מה להציג (הצריכה חייבת לטפל ב-falsy כדי לא להוסיף fragment ריק לפרומפט).
  function project(context) {
    if (!context || !Array.isArray(context.signals) || !context.signals.length) return '';
    var lines = [];
    var used = HEADER.length;
    for (var i = 0; i < context.signals.length && lines.length < MAX_ITEMS; i++) {
      var sentence = sentenceFor(context.signals[i]);
      if (!sentence) continue;
      var line = '- ' + sentence + '.';
      var addedLen = line.length + 1; // +1 עבור מפריד שורה
      if (used + addedLen > MAX_CHARS) break;
      lines.push(line);
      used += addedLen;
    }
    if (!lines.length) return '';
    return HEADER + '\n' + lines.join('\n');
  }

  var API = { project: project, MAX_ITEMS: MAX_ITEMS, MAX_CHARS: MAX_CHARS };

  if (typeof window !== 'undefined') { window.DerivedIntelligencePrompt = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
