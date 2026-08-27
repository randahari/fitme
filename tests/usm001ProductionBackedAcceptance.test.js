// USM-001 (docs/specs/USM_001_SPEC_v1.0.md §22) — CRITICAL PRODUCTION-BACKED ACCEPTANCE PROOF
// for the first vertical of the Authoritative User Understanding Foundation.
//
// This file drives the REAL production js/stateAccess.js, js/coachDecisionSystem/memoryLayer.js,
// js/userStatedMemoryPrompt.js, and js/coach/coachPromptComposer.js end-to-end. The one boundary
// stubbed is the Firestore-backed js/memory.js CRUD itself — js/memory.js's own D6 UI functions
// are, by longstanding, pre-existing, unrelated-to-this-Work-Item design (see tests/memory.test.js's
// own header), tightly coupled to browser globals (document/window/db/currentUser) and were never
// designed for Node testing. This test therefore simulates the Firestore-backed record store with
// a plain in-memory map, but constructs every record via js/memory.js's own real, exported,
// Node-testable makeMemory() helper (the exact same function createMemory() itself calls before
// writing to Firestore) — so record shape is real production code, not a hand-rolled fixture. The
// simulated store's "edit"/"delete" operations mirror updateMemory()/deleteMemory()'s own documented
// semantics exactly (merge payload+updated_at; remove).
//
// No Claude API call is made or asserted — acceptance is fixed at the level of the exact prompt
// string that would be sent to Claude (per SPEC §22 item 2's own instruction: prove prompt/content
// delivery, never nondeterministic LLM wording).
//
// Run with: node --test tests/usm001ProductionBackedAcceptance.test.js

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Memory = require('../js/memory.js');
const StateAccess = require('../js/stateAccess.js');
const MemoryLayer = require('../js/coachDecisionSystem/memoryLayer.js');
const CoachPromptComposer = require('../js/coach/coachPromptComposer.js');

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };

// ── Simulated Firestore-backed Typed Memory store ───────────────────────────────────────────
// Real record construction via js/memory.js's own exported makeMemory() — not a hand-rolled shape.
function makeStore() {
  let nextId = 1;
  const docs = new Map();
  return {
    // Mirrors js/memory.js's createMemory(): real makeMemory() + validateMemory() (both
    // production code), assigns an id the way memCol().add()/listMemories() would.
    create(rec) {
      const m = Memory._internal.makeMemory(rec);
      const err = Memory._internal.validateMemory(m);
      if (err) throw new Error('invalid memory: ' + err);
      const id = 'm' + (nextId++);
      docs.set(id, m);
      return id;
    },
    // Mirrors js/memory.js's updateMemory(id, patch): merge only, updated_at refreshed —
    // never touches status/source/created_at unless the patch explicitly includes them.
    update(id, patch) {
      const existing = docs.get(id);
      if (!existing) throw new Error('no such memory: ' + id);
      docs.set(id, Object.assign({}, existing, patch, { updated_at: Date.now() }));
    },
    // Mirrors js/memory.js's deleteMemory(id): physical removal.
    remove(id) { docs.delete(id); },
    // Mirrors js/memory.js's listMemories(): attaches _id, returns all records (unfiltered —
    // filtering/consent is StateAccess's own job, per §8).
    list: async () => Array.from(docs.entries()).map(([id, v]) => Object.assign({ _id: id }, v))
  };
}

function makeEnv() {
  const store = makeStore();
  const profile = {
    name: 'רן', coachStyle: 'mixed', coachChatter: 'balanced', goal: 'cut', goalKcal: 2000, weight: 80, streak: 3,
    memoryConsent: { granted: false, at: 0 }
  };
  let generation = 1;

  StateAccess.configure({
    getUserProfile: () => profile,
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === generation,
    fetchUserStatedMemory: store.list
  });

  CoachPromptComposer.configure({
    sessionLifecycle: { getGeneration: () => generation, isCurrent: () => true },
    goalLabels: GOAL_LABELS
  });

  return { store, profile, setGeneration: (g) => { generation = g; } };
}

async function composedPrompt(env) {
  return CoachPromptComposer.buildSystemPrompt(env.profile, { meals: [], burned: 0, steps: 0 }, { uid: 'user-1' });
}

test('USM1-ACCEPT-1. consent NOT granted: an active user-stated fact does NOT reach the composed Coach Prompt', async () => {
  const env = makeEnv();
  env.store.create({ type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', status: 'active' });
  const prompt = await composedPrompt(env);
  assert.equal(prompt.indexOf('אני שונא לרוץ'), -1);
  assert.equal(prompt.indexOf('דברים שהמשתמש סיפר למאמן במפורש'), -1);
});

test('USM1-ACCEPT-2. consent granted: the fact reaches the composed Coach Prompt verbatim, under its own distinct header', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  env.store.create({ type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', status: 'active' });
  const prompt = await composedPrompt(env);
  assert.ok(prompt.indexOf('דברים שהמשתמש סיפר למאמן במפורש') !== -1);
  assert.ok(prompt.indexOf('אני שונא לרוץ') !== -1);
});

test('USM1-ACCEPT-3. EDIT: the next fresh prompt contains only the corrected value — the old value is gone', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  const id = env.store.create({ type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', status: 'active' });
  const before = await composedPrompt(env);
  assert.ok(before.indexOf('אני שונא לרוץ') !== -1);

  // Mirrors js/memory.js's own "עריכה" (edit) action — payload only, status/source untouched.
  env.store.update(id, { payload: { text: 'אני עכשיו אוהב לרוץ בבוקר' } });

  const after = await composedPrompt(env);
  assert.equal(after.indexOf('אני שונא לרוץ'), -1, 'old value must be gone');
  assert.ok(after.indexOf('אני עכשיו אוהב לרוץ בבוקר') !== -1, 'new value must be present');
});

test('USM1-ACCEPT-4. DELETE: the next fresh prompt no longer contains the deleted fact', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  const id = env.store.create({ type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', status: 'active' });
  assert.ok((await composedPrompt(env)).indexOf('אני שונא לרוץ') !== -1);

  env.store.remove(id); // mirrors js/memory.js's own deleteMemory()

  const after = await composedPrompt(env);
  assert.equal(after.indexOf('אני שונא לרוץ'), -1);
  assert.equal(after.indexOf('דברים שהמשתמש סיפר למאמן במפורש'), -1);
});

test('USM1-ACCEPT-5. CONSENT REVOKE: the next fresh prompt contains no Typed Memory content at all, without any page reload', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  env.store.create({ type: 'fact', payload: { text: 'אני שונא לרוץ' }, confidence: 1, source: 'user_stated', status: 'active' });
  assert.ok((await composedPrompt(env)).indexOf('אני שונא לרוץ') !== -1);

  // Mirrors the existing consent checkbox's own change handler — mutates the live in-memory
  // profile object synchronously, exactly as js/memory.js's real handler does before its own
  // (unrelated, out-of-scope) saveProfile() call.
  env.profile.memoryConsent = { granted: false, at: Date.now() };

  const after = await composedPrompt(env); // no reload — the very next Coach-prompt build
  assert.equal(after.indexOf('אני שונא לרוץ'), -1);
  assert.equal(after.indexOf('דברים שהמשתמש סיפר למאמן במפורש'), -1);
});

test('USM1-ACCEPT-6. only type:fact/preference + source:user_stated + status:active reach the prompt — a rejected fact and a migrated record do not, even though both are real, separately-created records', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  env.store.create({ type: 'fact', payload: { text: 'עובדה שנדחתה' }, confidence: 1, source: 'user_stated', status: 'rejected' });
  env.store.create({ type: 'coach_note', payload: { text: 'הערה ישנה שהועברה' }, confidence: 0.5, source: 'migrated', status: 'active' });
  env.store.create({ type: 'fact', payload: { text: 'עובדה פעילה' }, confidence: 1, source: 'user_stated', status: 'active' });
  const prompt = await composedPrompt(env);
  assert.equal(prompt.indexOf('עובדה שנדחתה'), -1);
  assert.equal(prompt.indexOf('הערה ישנה שהועברה'), -1);
  assert.ok(prompt.indexOf('עובדה פעילה') !== -1);
});

test('USM1-ACCEPT-7. legacy coachMemory fragment and the new Typed Memory fragment coexist, structurally distinct, with no interference in either direction', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  env.profile.coachMemory = { observations: [{ text: 'תצפית ישנה מהמערכת הישנה' }], preferences: {} };
  env.store.create({ type: 'fact', payload: { text: 'עובדה חדשה שנמסרה' }, confidence: 1, source: 'user_stated', status: 'active' });
  const prompt = await composedPrompt(env);
  assert.ok(prompt.indexOf('מה שלמדתי עליו עד כה: תצפית ישנה מהמערכת הישנה.') !== -1);
  assert.ok(prompt.indexOf('דברים שהמשתמש סיפר למאמן במפורש') !== -1);
  assert.ok(prompt.indexOf('עובדה חדשה שנמסרה') !== -1);
});

test('USM1-ACCEPT-8. a request whose session generation goes stale DURING the async fetch degrades honestly to UNAVAILABLE — never returns the prior generation\'s data (§8.3 step 4, B3 §9 rule 8)', async () => {
  const env = makeEnv();
  env.profile.memoryConsent = { granted: true, at: Date.now() };
  env.store.create({ type: 'fact', payload: { text: 'עובדה מהדור הישן' }, confidence: 1, source: 'user_stated', status: 'active' });
  // Simulate the generation changing mid-flight, between the moment the read is issued (generation
  // 1, current at that instant) and the moment its async fetch resolves (generation bumped to 2
  // during the fetch itself) — the exact race B3 §9 rule 8 protects against.
  let currentGen = 1;
  StateAccess.configure({
    getUserProfile: () => env.profile,
    getCurrentUser: () => ({ uid: 'user-1' }),
    isSessionCurrent: (gen) => gen === currentGen,
    fetchUserStatedMemory: async () => { currentGen = 2; return env.store.list(); }
  });
  const fragment = await MemoryLayer.assembleUserStatedMemoryFragment({ userId: 'user-1', sessionGeneration: 1, runId: 'race-1' });
  // The request was issued under generation 1 (current at issue time — the pre-fetch check
  // passes); the post-fetch re-check (B3 §9 rule 8) finds generation 1 no longer current and
  // degrades honestly, never returning the data the (now-stale) fetch actually retrieved.
  assert.equal(fragment.availability, 'UNAVAILABLE');
  assert.deepEqual(fragment.facts, []);
});

test('USM1-ACCEPT-9. two separately-configured users never see each other\'s facts (data isolation across a real user switch)', async () => {
  const userA = makeEnv();
  userA.profile.memoryConsent = { granted: true, at: Date.now() };
  userA.store.create({ type: 'fact', payload: { text: 'עובדה של משתמש א' }, confidence: 1, source: 'user_stated', status: 'active' });
  const promptA = await composedPrompt(userA);
  assert.ok(promptA.indexOf('עובדה של משתמש א') !== -1);

  // A real user switch: js/app.js's own composition root reconfigures StateAccess/
  // CoachPromptComposer with the new user's runtime state — simulated here by a second,
  // independent makeEnv() call (its own configure() calls supersede userA's, exactly as a real
  // logout/login would).
  const userB = makeEnv();
  userB.profile.memoryConsent = { granted: true, at: Date.now() };
  userB.store.create({ type: 'fact', payload: { text: 'עובדה של משתמש ב' }, confidence: 1, source: 'user_stated', status: 'active' });
  const promptB = await composedPrompt(userB);
  assert.ok(promptB.indexOf('עובדה של משתמש ב') !== -1);
  assert.equal(promptB.indexOf('עובדה של משתמש א'), -1, 'user B must never see user A\'s fact');
});
