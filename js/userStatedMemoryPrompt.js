// ══════════════════════════════════════════════════════════════════
// FitMe — User-Stated Memory Prompt Projector (USM-001, docs/specs/USM_001_SPEC_v1.0.md §10)
// אחריות בלעדית: הפיכת ה-fragment שהורכב ע"י assembleUserStatedMemoryFragment()
// (js/coachDecisionSystem/memoryLayer.js) לפרגמנט טקסט עברי חסום ודטרמיניסטי — לעולם לא
// dump גולמי של מסמכי Typed Memory. פונקציה טהורה: אינה קוראת state, אינה תלויה ב-session,
// אינה כותבת, אינה תלויה במודול אחר. MAX_FACTS/MAX_CHARS הם פרמטרי-הנדסה חסומים (SPEC §10.3)
// — לא מדיניות מוצר קנונית, ניתנים לכיול מחדש בעתיד ללא צורך בתיקון SPEC (מקביל בדיוק
// ל-feedbackDomain.js's RECOVERY_POLICIES / TRUST_CONFIRMATION_POLICY_V1's own תקדים). כותרת
// ומיקום נבדלים במפורש הן מ-derivedIntelligencePrompt.js (תובנות המוסקות מהתנהגות, לא הצהרה
// מפורשת של המשתמש) והן מ-coachMemoryFragment() הלגאסי (SPEC §12) — אין מיזוג בין השלושה.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Engineering-bounded implementation parameters (SPEC §10.3) — not claimed permanently
  // optimal, not Product policy. Deliberately not inherited from derivedIntelligencePrompt.js's
  // own MAX_ITEMS/MAX_CHARS, which answer a different question (bounding short, templated,
  // closed-vocabulary sentences, not raw, potentially longer, user-authored free text).
  var MAX_FACTS = 6;
  var MAX_CHARS = 600;
  var HEADER = 'דברים שהמשתמש סיפר למאמן במפורש:';

  // Renders one Typed Memory payload shape to text. {text} for a manually-added fact (the
  // only live producer at this repository baseline); {key,value} for a preference-shaped
  // payload (schema-recognized, no live producer yet — SPEC §8.5/RG-1). Any other/malformed
  // payload shape is skipped silently, never fabricated.
  function factText(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.text === 'string' && payload.text) return payload.text;
    if (payload.key !== undefined && payload.value !== undefined) return payload.key + ': ' + payload.value;
    return null;
  }

  // project(fragment) — SPEC §10.2. fragment is the object returned by
  // assembleUserStatedMemoryFragment(). Returns '' when unavailable or empty — matching
  // derivedIntelligencePrompt.js's own falsy-empty-string convention exactly, so callers need
  // no special-case handling. Deterministic: iterates fragment.facts in the order Memory
  // Layer/StateAccess already produced (updated_at desc, id asc tie-break) — never re-sorts.
  // Bounded by MAX_FACTS/MAX_CHARS — truncates, never throws, never overflows.
  function project(fragment) {
    if (!fragment || fragment.availability !== 'AVAILABLE' || !Array.isArray(fragment.facts) || !fragment.facts.length) return '';
    var lines = [];
    var used = HEADER.length;
    for (var i = 0; i < fragment.facts.length && lines.length < MAX_FACTS; i++) {
      var text = factText(fragment.facts[i] && fragment.facts[i].payload);
      if (!text) continue;
      var line = '- ' + text;
      var addedLen = line.length + 1; // +1 for the line separator
      if (used + addedLen > MAX_CHARS) break;
      lines.push(line);
      used += addedLen;
    }
    if (!lines.length) return '';
    return HEADER + '\n' + lines.join('\n');
  }

  var API = { project: project, MAX_FACTS: MAX_FACTS, MAX_CHARS: MAX_CHARS };

  if (typeof window !== 'undefined') { window.UserStatedMemoryPrompt = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
