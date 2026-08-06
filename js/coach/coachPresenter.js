// ══════════════════════════════════════════════════════════════════
// FitMe — Coach Presenter (C1-WP6, Coach and Prompt Composition)
// אחריות בלעדית: רינדור כרטיס המאמן במסך הבית (פעם אחת לפתיחה, session-guarded),
// ומסך הגדרות המאמן (renderCoachSettings/saveCoachSettings/setCoachStyle/
// setCoachChatter/testCoachMessage) — כולל תאימות מלאה ל-onclick המוטבעים
// הקיימים ("binding compatibility handlers", אותו דפוס כמו
// js/nutrition/mealEditorPresenter.js ב-WP5C). אינו מבצע כתיבות עמידות
// (saveProfile מוזרק, לא ממומש כאן) ואינו מרכיב פרומפט/מבצע בקשת AI בעצמו —
// קורא ל-CoachPromptComposer.composeHomeCardContext (ישירות, מודול-אחות
// יציב) ול-coachMessage המוזרק (closure — נשאר ב-app.js, שם הוא פסאדה
// ל-CoachClient.sendMessage). coachCardShown נשאר משתנה משותף ב-app.js
// (מאופס גם ב-reset הגלובלי) — מוזרק כ-getter/setter. חולץ מ-js/app.js
// ללא שינוי התנהגות — ראה docs/specs/C1_SPEC_v1.0.md §C1-WP6.
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

  // כרטיס המאמן במסך הבית — זהה לחלוטין ל-refreshCoachCard() המקורי, עם תוספת UX-12.5
  // (TASK-007 WP5): ensureCoachCardDismissButton, למטה.
  async function refreshCoachCard() {
    var userProfile = deps.getUserProfile();
    if (deps.getCoachCardShown() || !userProfile) return;
    deps.setCoachCardShown(true);
    var card = deps.documentRef.getElementById('coach-card');
    var textEl = deps.documentRef.getElementById('coach-card-text');
    if (!card || !textEl) return;
    var todayData = deps.getTodayData();
    var ctx = CoachPromptComposer.composeHomeCardContext(todayData, userProfile);
    var _gen = deps.sessionLifecycle.getGeneration(); // REM-002: session guard
    try {
      var msg = await deps.coachMessageFn(ctx);
      if (msg && deps.sessionLifecycle.isCurrent(_gen)) {
        textEl.textContent = msg;
        try { ensureCoachCardDismissButton(card); } catch (e) {} // UX-12.5: never breaks card display, same discipline as trigger-card's C2 dismiss button
        card.classList.remove('hidden');
      }
    } catch (e) { /* שקט — אם אין רשת פשוט לא מציגים כרטיס */ }
  }

  // ── TASK-007 UX-12.5 (WP5): Dismiss affordance for #coach-card, which previously had none —
  // created once (idempotent, same pattern as js/trigger/triggerController.js's
  // ensureTriggerCardDismissButton). Deliberately does NOT record C2 feedback: coach-card is a
  // standalone coach-composed message, not a Recommendation-/Initiative-/Trigger-/
  // Adaptive-proposal-like surface (it does not originate from js/coachDecisionSystem/* — see
  // TASK_007_SPEC_v1.0.md §13.4's repository evidence). Per §11.1 ("Dismiss... MAY record
  // feedback") and UX-11.1 ("Only interactions directed at a Recommendation-, Initiative-,
  // Trigger-, or Adaptive-proposal-like surface record a C2 feedback entry"), no feedback
  // record is required or appropriate here — and attempting one would require extending C2's
  // closed owner-derivation catalog in js/app.js's feedback-event writer (a strict two-owner
  // ternary, no third owner exists), which is outside TASK-007's authority (§4.2, domain logic
  // unchanged). See docs/specs/TASK_007_IMPLEMENTATION_PLAN.md WP5 for the full analysis. ──
  function ensureCoachCardDismissButton(card) {
    var btn = card.querySelector ? card.querySelector('.coach-card-dismiss') : null;
    if (!btn) {
      btn = deps.documentRef.createElement('button');
      btn.className = 'btn-ghost coach-card-dismiss';
      btn.style.cssText = 'width:auto;padding:6px 10px;margin:8px 0 0;font-size:12px;display:block';
      btn.textContent = 'סגור';
      card.appendChild(btn);
    }
    btn.onclick = function () { card.classList.add('hidden'); };
  }

  // ── COACH SETTINGS — זהה לחלוטין ל-renderCoachSettings()/saveCoachSettings()/
  // setCoachStyle()/setCoachChatter()/testCoachMessage() המקוריים. ──
  function renderCoachSettings() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var nameEl = deps.documentRef.getElementById('set-coach-name');
    if (nameEl) nameEl.value = userProfile.coachName || userProfile.name || '';
    var st = userProfile.coachStyle || 'mixed';
    var ch = userProfile.coachChatter || 'balanced';
    deps.documentRef.querySelectorAll('#set-coach-style .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.val === st); });
    deps.documentRef.querySelectorAll('#set-coach-chatter .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.val === ch); });
  }

  async function saveCoachSettings() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var nameEl = deps.documentRef.getElementById('set-coach-name');
    if (nameEl) userProfile.coachName = nameEl.value.trim() || userProfile.name;
    await deps.saveProfile();
  }

  async function setCoachStyle(v) {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    CoachProfile.setStyle(userProfile, v);
    deps.documentRef.querySelectorAll('#set-coach-style .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.val === v); });
    await deps.saveProfile();
  }

  async function setCoachChatter(v) {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    CoachProfile.setChatter(userProfile, v);
    deps.documentRef.querySelectorAll('#set-coach-chatter .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.val === v); });
    await deps.saveProfile();
  }

  async function testCoachMessage() {
    await saveCoachSettings();
    var out = deps.documentRef.getElementById('coach-test-out');
    if (!out) return;
    out.classList.remove('hidden');
    out.textContent = 'המאמן כותב...';
    try {
      var userProfile = deps.getUserProfile();
      var todayData = deps.getTodayData();
      var consumed = todayData.meals.reduce(function (s, m) { return s + (m.kcal || 0); }, 0);
      var msg = await deps.coachMessageFn(CoachProfile.coachName(userProfile) + ' פתח את מסך ההגדרות. היום צרך ' + consumed + ' קל׳ מתוך ' + userProfile.goalKcal + ', סטריק ' + (userProfile.streak || 0) + ' ימים. תגיד שלום קצר שמדגים את האופי שלך.');
      out.textContent = msg || 'לא התקבלה תשובה.';
    } catch (e) { out.textContent = 'שגיאה: ' + e.message; }
  }

  var API = {
    configure: configure,
    refreshCoachCard: refreshCoachCard,
    renderCoachSettings: renderCoachSettings,
    saveCoachSettings: saveCoachSettings,
    setCoachStyle: setCoachStyle,
    setCoachChatter: setCoachChatter,
    testCoachMessage: testCoachMessage
  };

  if (typeof window !== 'undefined') { window.CoachPresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
