// C1-WP6 — js/coach/coachPromptComposer.js unit tests.
// Covers: base system-prompt composition (identity/style/chatter/facts), coachMemory
// fragment, local coach-line templates across all kinds/tones, home-card context
// composition, and the full B5-integrated buildSystemPrompt (success/partial/failure/
// no-currentUser paths) — proving it reproduces the exact concatenation behavior of the
// two historical app.js layers it replaces (see tests/c1Wp6Wiring.test.js for the direct
// source-level comparison).
// Run with: node --test tests/coachPromptComposer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const CoachPromptComposer = require('../js/coach/coachPromptComposer.js');
const DerivedIntelligenceConsumer = require('../js/derivedIntelligenceConsumer.js');
const DerivedIntelligencePrompt = require('../js/derivedIntelligencePrompt.js');
// USM-001 (docs/specs/USM_001_SPEC_v1.0.md §9.3/§11) — the two new dependencies.
const CoachDecisionSystemMemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
const UserStatedMemoryPrompt = require('../js/userStatedMemoryPrompt.js');

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };

function configure(overrides) {
  CoachPromptComposer.configure(Object.assign({
    sessionLifecycle: { getGeneration: () => 1, isCurrent: () => true },
    goalLabels: GOAL_LABELS
  }, overrides));
}

function profile(overrides) {
  return Object.assign({ name: 'רן', coachStyle: 'mixed', coachChatter: 'balanced', goal: 'cut', goalKcal: 2000, weight: 80, streak: 3 }, overrides);
}

// ── buildBasePrompt ─────────────────────────────────────────────────────────────────────

test('buildBasePrompt includes identity, addresses the user by name, and includes style/chatter guidance', () => {
  configure();
  const s = CoachPromptComposer.buildBasePrompt(profile());
  assert.match(s, /אתה "המאמן"/);
  assert.match(s, /פונה למשתמש בשם: רן\./);
  assert.match(s, /אופי: /);
  assert.match(s, /אורך: /);
  assert.match(s, /אל תשתמש בכותרות, רשימות או Markdown/);
});

test('buildBasePrompt omits the facts sentence entirely when no facts are known', () => {
  configure();
  const s = CoachPromptComposer.buildBasePrompt({ name: 'רן' });
  assert.doesNotMatch(s, /הכר את מי שאתה מלווה/);
});

test('buildBasePrompt includes only the facts that are present (gender/age/weight/height/goal/goalKcal/days/workoutType/foods/streak)', () => {
  configure();
  const s = CoachPromptComposer.buildBasePrompt(profile({ gender: 'male', age: 30, height: 180, days: '4', workoutType: 'strength', foods: ['עוף', 'אורז'] }));
  assert.match(s, /מין: זכר/);
  assert.match(s, /גיל: 30/);
  assert.match(s, /משקל: 80 ק"ג/);
  assert.match(s, /גובה: 180 ס"מ/);
  assert.match(s, /מטרה: חיטוב 🔥/);
  assert.match(s, /יעד קלוריות יומי: 2000/);
  assert.match(s, /ימי אימון בשבוע: 4-5/);
  assert.match(s, /סוג אימון מועדף: strength/);
  assert.match(s, /מאכלים אהובים: עוף, אורז/);
  assert.match(s, /סטריק נוכחי: 3 ימים/);
});

test('buildBasePrompt falls back to the raw goal string when not in goalLabels, and unknown style/chatter fall back to mixed/balanced guidance', () => {
  configure();
  const s = CoachPromptComposer.buildBasePrompt(profile({ goal: 'unknown-goal', coachStyle: 'nonsense', coachChatter: 'nonsense' }));
  assert.match(s, /מטרה: unknown-goal/);
  assert.match(s, /שלב חום ידידותי עם דיוק ענייני/); // mixed guide
  assert.match(s, /עד 2 משפטים\. נעים וקולע/); // balanced guide
});

// ── LCSC-001 (docs/specs/LCSC_001_SPEC_v1.0.md §5/§9, Change B) — bounded Safety-scope prompt
// boundary. Tests the PROMPT CONTRACT ITSELF only — never a claim that the model will comply.
// One assertion per PD-LSC-04 concept, unconditional (present regardless of profile content).

test('buildBasePrompt includes the bounded Safety-scope instruction unconditionally, covering every required concept', () => {
  configure();
  const s = CoachPromptComposer.buildBasePrompt(profile());
  assert.match(s, /לעולם אל תאבחן מצב רפואי/, 'no diagnosis');
  assert.match(s, /לעולם אל תסיק מסקנה רפואית מתסמינים/, 'no unsupported medical inference');
  assert.match(s, /לעולם אל תיתן הוראת טיפול רפואי/, 'no medical treatment instructions');
  assert.match(s, /אל תמציא ציר זמן החלמה/, 'no invented recovery timeline');
  assert.match(s, /אם המשתמש דיווח במפורש על הנחיה רפואית פעילה.*כבד אותה כמגבלה/, 'respects an explicit user-reported medical restriction within its literal scope');
  assert.match(s, /כשמידע בטיחותי מהותי.*אינו ודאי, היה שמרן/, 'conservative uncertainty when Safety-relevant context is materially uncertain');
  assert.match(s, /אל תהפוך פציעה, כאב, מחלה, או אי-ודאות בטיחותית להמלצת אימון שאינה נתמכת במפורש/, 'no unsupported workout prescription from Safety-sensitive context');
  assert.match(s, /ואל תהפוך אותם להמלצת תזונה או החלמה שאינה נתמכת במפורש/, 'no unsupported nutrition/recovery prescription from Safety-sensitive context');
});

test('the Safety-scope instruction is explicit that it is a bounded defense-in-depth boundary, not canonical Safety validation (source-level check)', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(require.resolve('../js/coach/coachPromptComposer.js'), 'utf8');
  assert.match(src, /NOT canonical Safety validation/);
  assert.match(src, /NOT a deterministic guarantee/);
});

// ── coachMemoryFragment ─────────────────────────────────────────────────────────────────

test('coachMemoryFragment returns empty string when there is no coachMemory', () => {
  assert.equal(CoachPromptComposer.coachMemoryFragment({}), '');
  assert.equal(CoachPromptComposer.coachMemoryFragment(null), '');
});

test('coachMemoryFragment includes the last 8 observations and learned preferences', () => {
  const p = { coachMemory: { observations: Array.from({ length: 10 }, (_, i) => ({ text: 'obs' + i })), preferences: { tone: 'direct' } } };
  const s = CoachPromptComposer.coachMemoryFragment(p);
  assert.match(s, /מה שלמדתי עליו עד כה: obs2; obs3; obs4; obs5; obs6; obs7; obs8; obs9\./);
  assert.match(s, /העדפות שנלמדו: tone: direct\./);
});

test('coachMemoryFragment tolerates raw-string observation entries (not just {text})', () => {
  const p = { coachMemory: { observations: ['plain text obs'], preferences: {} } };
  assert.equal(CoachPromptComposer.coachMemoryFragment(p), 'מה שלמדתי עליו עד כה: plain text obs.');
});

// ── coachLine ────────────────────────────────────────────────────────────────────────────

test('coachLine produces the professional/warm/default variant per kind, matching the original tone rules', () => {
  const proPro = profile({ coachStyle: 'professional' });
  const warm = profile({ coachChatter: 'gentle' });
  const neutral = profile({ coachStyle: 'friendly', coachChatter: 'balanced' });

  assert.equal(CoachPromptComposer.coachLine(proPro, 'morning', { goal: 2000 }), 'בוקר טוב. יעד היום: 2000 קל׳.');
  assert.equal(CoachPromptComposer.coachLine(warm, 'morning', { goal: 2000 }), 'בוקר טוב רן ☀️ יום חדש, הזדמנות חדשה. היעד שלך היום: 2000 קל׳.');
  assert.equal(CoachPromptComposer.coachLine(neutral, 'morning', { goal: 2000 }), 'בוקר טוב רן! היעד שלך היום: 2000 קל׳.');

  // LCSC-001 (docs/specs/LCSC_001_SPEC_v1.0.md §6/§10, Change C) — no arm names a specific food.
  assert.equal(CoachPromptComposer.coachLine(proPro, 'protein', { have: 50, target: 140 }), 'חלבון: 50g מתוך 140g.');
  assert.equal(CoachPromptComposer.coachLine(warm, 'protein', { have: 50, target: 140 }), 'רן, שים לב לחלבון — 50g מתוך 140g. תוספת קטנה של מקור חלבון תסגור את הפער יפה.');
  assert.equal(CoachPromptComposer.coachLine(neutral, 'protein', { have: 50, target: 140 }), 'חסר קצת חלבון: 50g מתוך 140g. תוספת קטנה של מקור חלבון תעזור.');
  [proPro, warm, neutral].forEach((p) => {
    assert.doesNotMatch(CoachPromptComposer.coachLine(p, 'protein', { have: 50, target: 140 }), /ביצ|עוף|קוטג/, 'no protein variant may name a specific food');
  });

  assert.equal(CoachPromptComposer.coachLine(proPro, 'evening', { remain: 300 }), 'נותרו 300 קל׳ להיום.');
  assert.equal(CoachPromptComposer.coachLine(proPro, 'streak', { streak: 5 }), 'סטריק 5 ימים — טרם נרשמה ארוחה היום.');
  assert.equal(CoachPromptComposer.coachLine(proPro, 'achieve', { title: 'X', icon: '🏆' }), 'הישג חדש: X.');
  assert.equal(CoachPromptComposer.coachLine(proPro, 'workout', { burn: 400 }), 'אימון נשמר. 400 קל׳.');
});

test('coachLine: "minimal" chatter is treated as "pro" tone even with a non-professional style', () => {
  const p = profile({ coachStyle: 'friendly', coachChatter: 'minimal' });
  assert.equal(CoachPromptComposer.coachLine(p, 'evening', { remain: 100 }), 'נותרו 100 קל׳ להיום.');
});

test('coachLine returns empty string for an unknown kind', () => {
  assert.equal(CoachPromptComposer.coachLine(profile(), 'nonexistent-kind', {}), '');
});

// ── composeHomeCardContext ──────────────────────────────────────────────────────────────

test('composeHomeCardContext sums meal kcal/protein, computes remaining and target protein, and includes the goal label', () => {
  configure();
  const todayData = { meals: [{ kcal: 300, protein: 20 }, { kcal: 200, protein: 10 }], burned: 0, steps: 0 };
  const s = CoachPromptComposer.composeHomeCardContext(todayData, profile({ weight: 80, goalKcal: 2000, streak: 5 }));
  assert.match(s, /צרך 500 קל׳ מתוך 2000 \(נותרו 1500\)/);
  assert.match(s, /חלבון 30g מתוך 144g/);
  assert.match(s, /סטריק 5 ימים/);
  assert.match(s, /מטרה: חיטוב 🔥/);
});

test('composeHomeCardContext clamps remaining to 0 when consumption exceeds the goal', () => {
  configure();
  const todayData = { meals: [{ kcal: 3000, protein: 0 }], burned: 0, steps: 0 };
  const s = CoachPromptComposer.composeHomeCardContext(todayData, profile({ goalKcal: 2000 }));
  assert.match(s, /נותרו 0\)/);
});

test('composeHomeCardContext defaults targetProtein to weight 75 when no weight is set', () => {
  configure();
  const s = CoachPromptComposer.composeHomeCardContext({ meals: [], burned: 0, steps: 0 }, profile({ weight: undefined, goalKcal: 2000 }));
  assert.match(s, /מתוך 135g/); // round(75 * 1.8)
});

// ── buildSystemPrompt (full B5-integrated composition) ─────────────────────────────────

test('buildSystemPrompt returns just the base prompt when there is no currentUser (B5 never attempted)', async () => {
  configure();
  let buildCalled = false;
  const origBuild = DerivedIntelligenceConsumer.build;
  DerivedIntelligenceConsumer.build = async () => { buildCalled = true; return { status: 'SUCCESS', context: {} }; };
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, null);
    assert.equal(buildCalled, false);
    assert.equal(s, CoachPromptComposer.buildBasePrompt(profile()));
  } finally { DerivedIntelligenceConsumer.build = origBuild; }
});

test('buildSystemPrompt appends the coachMemory fragment when present', async () => {
  configure();
  const p = profile({ coachMemory: { observations: [{ text: 'אוהב חלבון גבוה' }], preferences: {} } });
  const s = await CoachPromptComposer.buildSystemPrompt(p, { meals: [], burned: 0, steps: 0 }, null);
  assert.ok(s.endsWith('מה שלמדתי עליו עד כה: אוהב חלבון גבוה.'));
});

test('buildSystemPrompt appends the B5 derived-intelligence fragment on SUCCESS, via DerivedIntelligencePrompt.project', async () => {
  configure();
  const origBuild = DerivedIntelligenceConsumer.build;
  const origProject = DerivedIntelligencePrompt.project;
  let capturedRequest = null;
  DerivedIntelligenceConsumer.build = async (req) => { capturedRequest = req; return { status: 'SUCCESS', context: { marker: 'ctx' } }; };
  DerivedIntelligencePrompt.project = (ctx) => { assert.deepEqual(ctx, { marker: 'ctx' }); return 'תובנה גזורה'; };
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [{ kcal: 1 }], burned: 50, steps: 0 }, { uid: 'u1' });
    assert.ok(s.endsWith('תובנה גזורה'));
    assert.equal(capturedRequest.consumer, 'AI_COACH_PROMPT');
    assert.equal(capturedRequest.policyId, 'COACH_PROMPT_V1');
    assert.equal(capturedRequest.session.uid, 'u1');
    assert.equal(capturedRequest.session.generation, 1);
    assert.deepEqual(capturedRequest.intent.contextEvents.sort(), ['MEAL_LOGGED', 'WORKOUT_COMPLETED'].sort());
  } finally { DerivedIntelligenceConsumer.build = origBuild; DerivedIntelligencePrompt.project = origProject; }
});

test('buildSystemPrompt also appends the derived fragment on PARTIAL status', async () => {
  configure();
  const origBuild = DerivedIntelligenceConsumer.build;
  const origProject = DerivedIntelligencePrompt.project;
  DerivedIntelligenceConsumer.build = async () => ({ status: 'PARTIAL', context: {} });
  DerivedIntelligencePrompt.project = () => 'חלקי';
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.ok(s.endsWith('חלקי'));
  } finally { DerivedIntelligenceConsumer.build = origBuild; DerivedIntelligencePrompt.project = origProject; }
});

test('buildSystemPrompt returns just base+mem on FAILED status (no derived fragment, no throw)', async () => {
  configure();
  const origBuild = DerivedIntelligenceConsumer.build;
  DerivedIntelligenceConsumer.build = async () => ({ status: 'FAILED' });
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.equal(s, CoachPromptComposer.buildBasePrompt(profile()));
  } finally { DerivedIntelligenceConsumer.build = origBuild; }
});

test('buildSystemPrompt swallows a thrown B5 error entirely — the prompt still resolves with base+mem (never blocks)', async () => {
  configure();
  const origBuild = DerivedIntelligenceConsumer.build;
  DerivedIntelligenceConsumer.build = async () => { throw new Error('boom'); };
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.equal(s, CoachPromptComposer.buildBasePrompt(profile()));
  } finally { DerivedIntelligenceConsumer.build = origBuild; }
});

// ── USM-001 (docs/specs/USM_001_SPEC_v1.0.md §11) — the new, third, structurally distinct
// user-stated-memory fragment step, placed between the legacy mem fragment and the B5
// derived fragment ────────────────────────────────────────────────────────────────────────

test('USM1-27. consent granted (fragment AVAILABLE with facts) -> the Typed Memory fragment is present in the composed prompt', async () => {
  configure();
  const origAssemble = CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment;
  const origProject = UserStatedMemoryPrompt.project;
  let capturedIdentity = null;
  CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = async (identity) => {
    capturedIdentity = identity;
    return { schemaVersion: 'x', userId: identity.userId, assembledAt: Date.now(), facts: [{ id: 'm1', type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', updatedAt: 1 }], availability: 'AVAILABLE' };
  };
  UserStatedMemoryPrompt.project = (fragment) => (fragment.availability === 'AVAILABLE' && fragment.facts.length) ? 'דברים שהמשתמש סיפר למאמן במפורש:\n- אני שונא לרוץ' : '';
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.ok(s.indexOf('אני שונא לרוץ') !== -1);
    assert.equal(capturedIdentity.userId, 'u1');
    assert.equal(capturedIdentity.sessionGeneration, 1);
  } finally {
    CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = origAssemble;
    UserStatedMemoryPrompt.project = origProject;
  }
});

test('USM1-28. consent not granted (fragment UNAVAILABLE/empty) -> no Typed Memory content appears, and the rest of the prompt is unaffected', async () => {
  configure();
  const origAssemble = CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment;
  CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = async () => ({ schemaVersion: 'x', userId: 'u1', assembledAt: Date.now(), facts: [], availability: 'UNAVAILABLE' });
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.equal(s, CoachPromptComposer.buildBasePrompt(profile()));
  } finally { CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = origAssemble; }
});

test('USM1-29. the legacy coachMemory fragment remains byte-identical when the new fragment is also present (no merge, no interference)', async () => {
  configure();
  const origAssemble = CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment;
  CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = async () => ({ facts: [{ payload: { text: 'עובדה חדשה' } }], availability: 'AVAILABLE' });
  const p = profile({ coachMemory: { observations: [{ text: 'אוהב חלבון גבוה' }], preferences: {} } });
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(p, { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.ok(s.indexOf('מה שלמדתי עליו עד כה: אוהב חלבון גבוה.') !== -1, 'legacy fragment text must still be present, unchanged');
    assert.ok(s.indexOf('דברים שהמשתמש סיפר למאמן במפורש') !== -1, 'new fragment must also be present');
  } finally { CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = origAssemble; }
});

test('USM1-30. the new fragment is structurally distinct and positioned between the legacy mem fragment and the B5 derived fragment (§11.2 ordering)', async () => {
  configure();
  const origAssemble = CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment;
  const origBuild = DerivedIntelligenceConsumer.build;
  const origProject = DerivedIntelligencePrompt.project;
  CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = async () => ({ facts: [{ payload: { text: 'X' } }], availability: 'AVAILABLE' });
  DerivedIntelligenceConsumer.build = async () => ({ status: 'SUCCESS', context: {} });
  DerivedIntelligencePrompt.project = () => 'תובנה גזורה';
  const p = profile({ coachMemory: { observations: [{ text: 'Y' }], preferences: {} } });
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(p, { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    const iMem = s.indexOf('מה שלמדתי עליו עד כה');
    const iUserStated = s.indexOf('דברים שהמשתמש סיפר למאמן במפורש');
    const iDerived = s.indexOf('תובנה גזורה');
    assert.ok(iMem !== -1 && iUserStated !== -1 && iDerived !== -1);
    assert.ok(iMem < iUserStated, 'legacy mem fragment must precede the new user-stated fragment');
    assert.ok(iUserStated < iDerived, 'the new user-stated fragment must precede the B5 derived fragment');
  } finally {
    CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = origAssemble;
    DerivedIntelligenceConsumer.build = origBuild;
    DerivedIntelligencePrompt.project = origProject;
  }
});

test('USM1-31. a thrown error from the new step is swallowed entirely — the prompt still resolves with base+mem+derived (never blocks, mirrors the B5 step\'s own discipline)', async () => {
  configure();
  const origAssemble = CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment;
  const origBuild = DerivedIntelligenceConsumer.build;
  const origProject = DerivedIntelligencePrompt.project;
  CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = async () => { throw new Error('boom'); };
  DerivedIntelligenceConsumer.build = async () => ({ status: 'SUCCESS', context: {} });
  DerivedIntelligencePrompt.project = () => 'תובנה גזורה';
  try {
    const s = await CoachPromptComposer.buildSystemPrompt(profile(), { meals: [], burned: 0, steps: 0 }, { uid: 'u1' });
    assert.ok(s.endsWith('תובנה גזורה'));
    assert.equal(s.indexOf('דברים שהמשתמש סיפר למאמן במפורש'), -1);
  } finally {
    CoachDecisionSystemMemoryLayer.assembleUserStatedMemoryFragment = origAssemble;
    DerivedIntelligenceConsumer.build = origBuild;
    DerivedIntelligencePrompt.project = origProject;
  }
});

test('USM1-32. the new step performs no classification of any kind — no Domain/Topic/Opportunity/Trust/Goal/Target token appears anywhere in coachPromptComposer.js\'s own source', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(require.resolve('../js/coach/coachPromptComposer.js'), 'utf8');
  ['contextualMeaningPolicy', 'evidenceEvaluator', 'eligibilityEvaluator', 'trustTestSignal', 'relationshipMaturity', 'DetectedOpportunity'].forEach((needle) => {
    assert.equal(src.indexOf(needle), -1, needle + ' must not appear in coachPromptComposer.js');
  });
});
