# REM-003 — Generative vs. Authoritative Boundary
## Product Specification

# 1. Purpose

מטרת REM-003 היא ליצור גבול ארכיטקטוני ברור בין מודל ה־LLM לבין מקור האמת של FITME.

לאחר השלמת משימה זו:
- ה־LLM אחראי על הבנה, ניתוח, הסברים, המלצות והסקת כוונות בלבד.
- ה־LLM לעולם לא אחראי על קביעת עובדות.
- כל מידע Authoritative נוצר אך ורק באמצעות מנועים דטרמיניסטיים או הצהרות משתמש שעברו מסלול אישור מוגדר.

REM-003 מגדיר את חוזה הסמכויות (Authority Contract) ואינו משנה התנהגות מוצר מאושרת,
למעט התאמות הנדרשות כדי שכל נתיב כתיבה המקבל קלט מה־LLM יעמוד בגבול החדש.
REM-003 אינו כולל מימוש של Phase B (Persistence Contract מלא או איחוד כל נתיבי הכתיבה).

# 2. Motivation

מודלי שפה הם מערכות הסתברותיות ולכן אסור להם לעדכן ישירות:
- Coach Memory
- Goals
- Habits
- Patterns
- Nutrition
- Progress
- Health Data
- User State
- Firestore

כל כתיבה חייבת לעבור שכבת אימות דטרמיניסטית.

# 3. Core Principle

**The AI never creates facts.**

ה־AI יכול:
- להבין
- לנתח
- להסביר
- להציע
- לנחש
- להעריך
- לחלץ Intent

הוא אינו רשאי לקבוע מהי אמת.

מקור האמת היחיד הוא:
**Authoritative Business Logic**

# 4. Trust Model

## Level 1 — Generative
מידע שנוצר ע"י ה־LLM.
אינו אמת, אינו נשמר כעובדה ויכול לשמש רק כקלט.

## Level 2 — Validated
מידע שעבר Validation, Business Rules, Normalization ובדיקות דומיין.
עדיין אינו מקור אמת.

## Level 3 — Authoritative
מקור האמת של FITME.
רק מידע ברמה זו משפיע על Memory, Engines, Analytics והתקדמות המשתמש.

## Generative Persistent Data

לא כל מידע הנשמר במערכת הוא Authoritative.

מותר לשמור מידע שנוצר ע"י AI כאשר הוא מסומן במפורש כ־Generative, אינו משמש מקור אמת,
ואינו נקרא על ידי מנועים דטרמיניסטיים.

דוגמאות:
- Weekly Menu
- AI Suggestions
- Draft Plans
- Conversation History


# 5. Authoritative Creation Paths

מידע יכול להפוך ל־Authoritative באחד משני מסלולים בלבד.

## Path A — Explicit User Declaration
הצהרת משתמש מפורשת שעוברת Validation, Business Rules ואישור לפי הצורך.

## Path B — Deterministic Evidence
מסקנה של מנוע דטרמיניסטי (Habit Engine, Pattern Engine וכו') המבוססת על ראיות מצטברות.

# 6. Evidence First Principle

אירוע בודד אינו יוצר עובדה.

Observation
→ Evidence
→ Threshold
→ Deterministic Evaluation
→ Authoritative Fact

לכל מנוע סף ראיות משלו.

# 7. Single Observation Rule

Observation ≠ Fact

גם Confidence של 100% אינו הופך מידע לעובדה.

# 8. Authority Matrix

## LLM
מותר:
- להבין
- לזהות Intent
- לזהות Entities
- לנתח תמונות
- להסביר
- להמליץ

אסור:
- לעדכן Firestore
- Memory
- Goals
- Habits
- Patterns
- Nutrition
- Progress
- User State

## Validators
בודקים תקינות בלבד.
אינם מבצעים כתיבה.

## Business Logic
מחליט האם פעולה מותרת.
אינו יוצר מידע חדש.

## Authoritative Engines
יוצרים עובדות רק לפי SPEC מאושר.

## Persistence Layer
REM-003 אינו מחייב איחוד כל נתיבי הכתיבה לרכיב אחד. נושא זה שייך ל־Phase B.
בסקופ REM-003 כל נתיב כתיבה המקבל קלט מה־LLM חייב לעמוד ב־Authoritative Write Contract.

# 9. Authoritative Write Contract

Input
→ LLM (Optional)
→ Validation
→ Business Rules
→ Deterministic Decision
→ Persistence Layer
→ Firestore

כל נתיב כתיבה חדש חייב להשתלב גם עם SessionLifecycle (REM-002) ואסור לעקוף את generation guards.

# 10. Forbidden Write Paths

אסור:
- LLM → Firestore (למעט Generative Persistent Data שאינו מקור אמת)

כל נתיב כתיבה חדש חייב להשתלב גם עם SessionLifecycle (REM-002) ואסור לעקוף את generation guards.
- LLM → Coach Memory
- LLM → Goals
- LLM → Habits
- LLM → Patterns
- LLM → Nutrition
- LLM → Progress
- LLM → TDEE

### Quick Learn

מסלול Quick Learn אינו פטור מהגבול החדש.
במסגרת מימוש REM-003 עליו לעמוד באותו Authoritative Write Contract כמו שאר מסלולי ה־AI.

# 11. Intent Is Not Authority

Intent אינו משנה מידע.
רק המודול העסקי המתאים רשאי לבצע את השינוי.

# 12. Recommendations Never Become Facts

Recommendation היא תמיד המלצה בלבד.
גם Recommendation Engine בעתיד לא ייצור עובדות.

# 13. Confidence Is Not Authority

Confidence מודד ביטחון של המודל ולא אמיתות.

# 14. Historical Evidence Principle

מנועים דטרמיניסטיים מסתמכים על:
- History
- Logs
- Measurements
- Existing Facts

ולא על תשובת ה־LLM.

# 15. Human Override

המשתמש הוא מקור הסמכות לפרטים האישיים שלו.
לאחר Validation מתאים, הצהרתו מחליפה ערך קודם.

# 16. Edge Cases

- Confidence גבוה אינו יוצר עובדה.
- הצהרת משתמש חדשה גוברת על מידע קודם בתחום שבאחריותו.
- AI אינו יוצר Pattern.
- ביצוע חד־פעמי של המלצה אינו יוצר Habit.
- גם שבוע של ביצוע אינו מספיק; רק Habit Engine מחליט.
- נתונים ממכשיר Authoritative נשמרים לאחר Validation ללא תלות ב־LLM.

# 17. Future Engine Contract

כל Engine חדש חייב להגדיר:
- Inputs
- Outputs
- Authority Level
- Write Permission
- Validation Rules

# 18. Default Rule

Deny by Default.

אם לא הוגדרה הרשאת כתיבה במפורש — אסור לכתוב.

# 19. Acceptance Criteria

- שלוש רמות אמון.
- שני מסלולי יצירת Authoritative.
- Authoritative Write Contract.
- גבולות סמכות לכל רכיב.
- איסור כתיבה ישירה של LLM.
- הצהרת משתמש כמסלול סמכותי.
- עובדות מהתנהגות רק באמצעות ראיות ומנוע דטרמיניסטי.
- Confidence אינו סמכות.
- Recommendations אינן עובדות.
- כל Engine עתידי מחויב בחוזה סמכות.

# 20. Engineering Readiness Review

Architecture: READY
Product: READY
Scope: חוזה ארכיטקטוני בלבד.
Risk: נמוך.

Engineering Review: READY

Status: APPROVED / IMPLEMENTED
Product & Architecture Review: APPROVED
Implementation Version: 2.20.0
Automated Tests: 42 passed / 0 failed

# 21. Definition of Done

- SPEC מאושר.
- Claude מממש את החוזה.
- כל נתיב כתיבה המקבל קלט מה־LLM עובר דרך Authoritative Write Contract.
- אין כתיבה ישירה של LLM למידע Authoritative.
- קיימות בדיקות הרשאות כתיבה.
- נשמרת תאימות מלאה ל־REM-001 ול־REM-002.
- Roadmap, Changelog ותיעוד מעודכנים.

# Recommended Additions

## Authority Metadata
כל מידע Authoritative ישמור authoritySource כגון:
- USER_DECLARATION
- USER_CONFIRMED_AI_ESTIMATE
- HABIT_ENGINE
- PATTERN_ENGINE
- DEVICE
- SYSTEM

USER_CONFIRMED_AI_ESTIMATE:
ערך שהוצע על ידי AI, נסקר ואושר במפורש על ידי המשתמש.

## Audit Trail
כל Authoritative Write ישמור:
- מי יצר
- מתי
- לפי איזה Rule
- גרסת מערכת

## Guiding Principle

מקור הסמכות נקבע לפי סוג המידע, לא לפי מקור ההגעה שלו.

- המשתמש הוא מקור הסמכות לפרטים האישיים, יעדים והעדפות.
- מנועים דטרמיניסטיים הם מקור הסמכות להרגלים ולדפוסים.
- מכשירים מאושרים הם מקור הסמכות למדידות שהם מספקים.
- ה־LLM אינו מקור סמכות לשום סוג מידע.
