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

  assert.equal(CoachPromptComposer.coachLine(proPro, 'protein', { have: 50, target: 140 }), 'חלבון: 50g מתוך 140g.');
  assert.equal(CoachPromptComposer.coachLine(warm, 'protein', { have: 50, target: 140 }), 'רן, שים לב לחלבון — 50g מתוך 140g. ביצה, עוף או קוטג׳ יסגרו את הפער יפה.');

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
