// ══════════════════════════════════════════════════════════════════
// FitMe — Adaptive TDEE Controller (C1-WP7, Adaptive TDEE Domain)
// אחריות בלעדית: "Application/UI Responsibilities" — טעינת היסטוריה
// והרצת המנוע (runAdaptiveCheck, דרך State Access), רינדור כרטיס ההצעה
// ופניית ה"יום חלקי", בקשת הסבר AI מהמאמן, החלת/דחיית הצעה, אישור יום
// קליל, עדכוני הגדרות (קצב/הפעלה), ורישום היקפים. תלוי ישירות ב-
// AdaptiveTdeeDomain (המודול הטהור, WP7) וב-AuthorityContract/
// PersistenceGateway/DateUtils (מודולים יציבים B3/B4/WP1, ללא override
// chain) — אותו דפוס כמו js/nutrition/mealCommitService.js. DOM, session,
// state (userProfile/todayData/currentUser/_adaptProposal), ופונקציות
// app.js אחרות (חלקן עטופות מאוחר יותר — renderHome/renderSettings)
// מוזרקים דרך configure(). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP7.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var AdaptiveTdeeDomain = (typeof module !== 'undefined' && module.exports)
    ? require('./adaptiveTdeeDomain.js')
    : window.AdaptiveTdeeDomain;
  var AuthorityContract = (typeof module !== 'undefined' && module.exports)
    ? require('../authorityContract.js')
    : window.AuthorityContract;
  var PersistenceGateway = (typeof module !== 'undefined' && module.exports)
    ? require('../persistenceGateway.js')
    : window.PersistenceGateway;
  var DateUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/dateUtils.js')
    : window.DateUtils;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // B3: access (EngineStateAccess) מגיע מהאדפטר — זהה לחלוטין ל-runAdaptiveCheck() המקורי.
  // UI (renderAdaptiveCard/renderPartialPrompt) נשארות אחריות האדפטר ב-app.js, אחרי
  // החישוב, בדיוק כמו קודם (§17). session checks עוברים דרך State Access עצמו.
  async function runAdaptiveCheck(access) {
    var userProfile = deps.getUserProfile();
    if (!userProfile || !access) return;
    if (!AdaptiveTdeeDomain.adaptEnabled(userProfile)) return;
    var profile = access.read.adaptiveProfile();
    var history = await access.read.nutritionActivityHistory();
    await access.write.markAdaptiveCheckCompleted({ history: history }); // לשימוש פניית המאמן על ימים חלקיים

    var last = profile.lastTdeeUpdate;
    var dueByTime = !last || DateUtils.daysBetween(DateUtils.getTodayKey(), last) >= AdaptiveTdeeDomain.ADAPT_CADENCE_DAYS;

    if (dueByTime) {
      var prop = AdaptiveTdeeDomain.buildAdaptiveProposal(history, profile, deps.getTodayData());
      if (prop.ready && prop.delta !== 0) await access.write.storeAdaptiveProposal({ proposal: prop });
    }
  }

  // כרטיס ההצעה במסך הבית — זהה לחלוטין ל-renderAdaptiveCard() המקורי.
  async function renderAdaptiveCard() {
    var card = deps.documentRef.getElementById('adaptive-card');
    if (!card) return;
    var p = deps.getAdaptProposal();
    if (!p) { card.classList.add('hidden'); return; }
    var arrow = p.delta > 0 ? '↑' : '↓';
    var textEl = deps.documentRef.getElementById('adaptive-card-text');
    var metaEl = deps.documentRef.getElementById('adaptive-card-meta');
    if (metaEl) metaEl.textContent =
      p.oldGoal.toLocaleString() + ' → ' + p.newGoal.toLocaleString() + ' קל׳ ' + arrow + ' · TDEE נלמד: ' + p.calc.tdee.toLocaleString() + ' · על סמך ' + p.calc.nDays + ' ימי רישום ו-' + p.calc.nWeights + ' שקילות';
    var _gen = deps.sessionLifecycle.getGeneration(); // REM-002: session guard
    if (textEl) {
      textEl.textContent = AdaptiveTdeeDomain.adaptiveLocalExplain(p); // מיידי
      try {
        var msg = await coachAdaptiveMessage(p);
        if (msg && deps.sessionLifecycle.isCurrent(_gen)) textEl.textContent = msg;
      } catch (e) {}
    }
    if (!deps.sessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי — לא חושפים את הכרטיס
    card.classList.remove('hidden');
  }

  // המאמן מבשר על העדכון בקול/אופי שלו — זהה לחלוטין ל-coachAdaptiveMessage() המקורי.
  async function coachAdaptiveMessage(p) {
    var s = p.signals;
    var measTxt = [
      s.waistDown ? 'המותן יורד' : s.waistUp ? 'המותן עולה' : null,
      s.armDown ? 'הזרוע קטֵנה' : s.armUp ? 'הזרוע גדלה' : null
    ].filter(Boolean).join(', ') || 'אין עדיין מספיק היקפים';
    var userProfile = deps.getUserProfile();
    var ctx = 'סיכום שבועי של המנוע המסתגל עבור ' + deps.coachNameFn() + ': מטרה ' + deps.goalLabels[userProfile.goal] + '. '
      + 'TDEE אמיתי שנלמד מהנתונים: ' + p.calc.tdee + ' קל׳ (ממוצע צריכה ' + p.calc.avgIntake + ', שינוי משקל ' + p.calc.slopeKgPerWeek.toFixed(2) + ' ק"ג/שבוע). '
      + 'היקפים: ' + measTxt + '. היעד עובר מ-' + p.oldGoal + ' ל-' + p.newGoal + ' קל׳. '
      + 'הסבר בקצרה למה השינוי הזה נכון עכשיו, בגובה העיניים, בלי לדקלם מספרים מיותרים. עודד להמשיך.';
    return await deps.coachMessageFn(ctx);
  }

  // B4 §16.3/§26: applyAdaptiveUpdate() נשאר מחוץ ל-Registry (B2 SPEC §17/§19, פעולה ידנית
  // מאושרת ע"י המשתמש). candidate state מחושב מקומית ואינו נכתב ל-userProfile לפני הצלחה
  // durable (§26 כלל 2/3/6); goalKcal/adaptiveTdee/currentDeficit/lastTdeeUpdate נכתבים
  // field-scoped (owner: profileGoalsState, B3 §6) במקום saveProfile() המלא. זהה לחלוטין
  // ל-applyAdaptiveUpdate() המקורי.
  async function applyAdaptiveUpdate() {
    var p = deps.getAdaptProposal();
    var userProfile = deps.getUserProfile();
    var currentUser = deps.getCurrentUser();
    if (!p || !userProfile || !currentUser) return;
    var gen = deps.sessionLifecycle.getGeneration(); // REM-002: נלכד לפני העבודה האסינכרונית
    var authority = AuthorityContract.buildAuthorityMetadata({
      // הרשומה מחושבת ע"י מנוע דטרמיניסטי (Adaptive TDEE), לא ע"י הצהרת משתמש —
      // authoritySource הוא SYSTEM. אישור המשתמש (לחיצת "אשר") מתועד דרך ה-rule עצמו.
      source: AuthorityContract.AUTHORITY_SOURCES.SYSTEM,
      createdBy: currentUser.uid,
      rule: 'ADAPTIVE_TDEE_USER_APPROVED',
      systemVersion: deps.appVersion
    });
    var historyEntry = { date: DateUtils.getTodayKey(), tdee: p.calc.tdee, goalKcal: p.newGoal, deficit: p.nextDeficit, authority: authority };
    var nextTdeeHistory = (Array.isArray(userProfile.tdeeHistory) ? userProfile.tdeeHistory : []).concat([historyEntry]);

    var result = await PersistenceGateway.persist({
      requestId: 'adaptive-apply-' + currentUser.uid + '-' + Date.now(),
      operation: 'DERIVED_ADAPTIVE_PROPOSAL_APPLY',
      domain: 'USER_PROFILE',
      owner: 'profileGoalsState',
      userId: currentUser.uid,
      sessionGeneration: gen,
      payload: {
        goalKcal: p.newGoal, adaptiveTdee: p.calc.tdee, currentDeficit: p.nextDeficit,
        lastTdeeUpdate: DateUtils.getTodayKey(), tdeeHistory: nextTdeeHistory
      },
      authority: authority,
      expectedVersion: null,
      idempotencyKey: null,
      createdAt: Date.now(),
      metadata: { engineId: null, trigger: 'MANUAL', runId: null }
    });

    if (result.status !== 'SUCCESS' && result.status !== 'NO_OP') {
      // B4 §16.3: "Not mark the update applied if persistence fails" — proposal נשאר פעיל.
      // REM-002: אין אפקט (alert) אם הסשן כבר אינו נוכחי.
      if (deps.sessionLifecycle.isCurrent(gen)) deps.alertFn('שמירת היעד נכשלה. נסה שוב.');
      return;
    }
    if (!deps.sessionLifecycle.isCurrent(gen)) return; // REM-002: stale-on-completion — אין אפקטים

    userProfile.adaptiveTdee = p.calc.tdee;
    userProfile.goalKcal = p.newGoal;
    userProfile.currentDeficit = p.nextDeficit;
    userProfile.lastTdeeUpdate = DateUtils.getTodayKey();
    userProfile.tdeeHistory = nextTdeeHistory;
    deps.clearAdaptProposal();
    renderAdaptiveCard();
    deps.renderHome();
    deps.renderSettings();
    deps.alertFn('היעד עודכן ל-' + p.newGoal.toLocaleString() + ' קל׳ ✓');
  }

  // זהה לחלוטין ל-dismissAdaptiveUpdate() המקורי — דוחים לשבוע, מסמנים שבדקנו היום.
  async function dismissAdaptiveUpdate() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    userProfile.lastTdeeUpdate = DateUtils.getTodayKey();
    await deps.saveProfile();
    deps.clearAdaptProposal();
    renderAdaptiveCard();
  }

  // ── פניית המאמן על ימים חלקיים — זהה לחלוטין ל-renderPartialPrompt() המקורי.
  // history/todayData/profile מתקבלים מהמוזרקים, לא מ-window._adaptHistoryCache/
  // userProfile גלובליים ישירות. ──
  function renderPartialPrompt() {
    var el = deps.documentRef.getElementById('partial-prompt');
    if (!el) return;
    var suspects = AdaptiveTdeeDomain.pendingPartialDays(deps.getAdaptHistoryCache(), deps.getTodayData(), deps.getUserProfile());
    if (!suspects.length) { el.classList.add('hidden'); return; }
    var list = suspects.map(function (d) {
      var dt = new Date(d.key + 'T00:00:00');
      var label = deps.daysHe[dt.getDay()] + ' ' + dt.getDate() + '/' + (dt.getMonth() + 1);
      return '<div class="partial-row">' +
        '<span>' + label + ' — נרשמו רק ' + d.kcal + ' קל׳</span>' +
        '<span style="display:flex;gap:6px">' +
          '<button class="btn-small" onclick="goToScreen(\'food\')">השלם</button>' +
          '<button class="btn-ghost" style="width:auto;padding:6px 10px;margin:0" onclick="confirmDayLight(\'' + d.key + '\')">אכלתי קליל</button>' +
        '</span>' +
      '</div>';
    }).join('');
    var txtEl = deps.documentRef.getElementById('partial-prompt-text');
    if (txtEl) txtEl.textContent = 'ראיתי ימים עם מעט מאוד רישום. עדכן אותי כדי שאדייק לך את היעד:';
    var listEl = deps.documentRef.getElementById('partial-prompt-list');
    if (listEl) listEl.innerHTML = list;
    el.classList.remove('hidden');
  }

  // זהה לחלוטין ל-confirmDayLight() המקורי.
  async function confirmDayLight(key) {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    if (!Array.isArray(userProfile.confirmedLightDays)) userProfile.confirmedLightDays = [];
    if (userProfile.confirmedLightDays.indexOf(key) < 0) userProfile.confirmedLightDays.push(key);
    await deps.saveProfile();
    renderPartialPrompt();
    await deps.runEngineAction('SOURCE_DATA_CHANGED', 'adaptiveTdeeEngine', 'WEIGHT_CHANGED'); // day-classification affects the TDEE window
  }

  // ── רישום היקפים — זהה לחלוטין ל-logMeasurements() המקורי. ──
  async function logMeasurements() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var waistEl = deps.documentRef.getElementById('meas-waist');
    var armEl = deps.documentRef.getElementById('meas-arm');
    var chestEl = deps.documentRef.getElementById('meas-chest');
    var waist = parseFloat(waistEl ? waistEl.value : undefined);
    var arm = parseFloat(armEl ? armEl.value : undefined);
    var chest = parseFloat(chestEl ? chestEl.value : undefined);
    if (!waist || waist < 30 || waist > 200) { deps.alertFn('הכנס היקף מותן תקין (ס"מ)'); return; }
    var entry = { date: DateUtils.getTodayKey(), waist: waist };
    if (arm && arm > 10 && arm < 80) entry.arm = arm;
    if (chest && chest > 40 && chest < 200) entry.chest = chest;
    if (!Array.isArray(userProfile.measurementHistory)) userProfile.measurementHistory = [];
    // דריסה אם כבר נרשם היום
    userProfile.measurementHistory = userProfile.measurementHistory.filter(function (m) { return m.date !== entry.date; });
    userProfile.measurementHistory.push(entry);
    ['meas-waist', 'meas-arm', 'meas-chest'].forEach(function (id) { var e = deps.documentRef.getElementById(id); if (e) e.value = ''; });
    await deps.saveProfile();
    renderMeasurements();
    deps.alertFn('ההיקפים נשמרו ✓');
  }

  // זהה לחלוטין ל-renderMeasurements() המקורי — כולל שימור מדויק של הקריאה
  // ל-analyzeMeasurements() בלי ארגומנט (ראה הערת הכותרת של adaptiveTdeeDomain.js).
  function renderMeasurements() {
    var el = deps.documentRef.getElementById('measurements-data');
    var userProfile = deps.getUserProfile();
    if (!el || !userProfile) return;
    var mh = userProfile.measurementHistory || [];
    if (!mh.length) { el.innerHTML = '<div class="empty-state">רשום היקף מותן שבועי כדי שהמאמן יוכל לוודא שהחיטוב בריא</div>'; return; }
    var last = mh[mh.length - 1];
    var meas = AdaptiveTdeeDomain.analyzeMeasurements();
    function trendTxt(v, goodDown) {
      if (v == null) return '';
      var dir = v < -0.05 ? '↓' : v > 0.05 ? '↑' : '=';
      var good = goodDown ? v < 0 : v > 0;
      var col = Math.abs(v) < 0.05 ? 'var(--text-3)' : good ? '#1D9E75' : '#BA7517';
      return '<span style="color:' + col + ';font-size:11px"> ' + dir + ' ' + Math.abs(v).toFixed(1) + ' ס"מ/שבוע</span>';
    }
    var goalCut = userProfile.goal === 'cut';
    el.innerHTML =
      '<div class="health-row"><span class="health-label">מותן</span><span class="health-val">' + last.waist + ' ס"מ' + trendTxt(meas.waist, goalCut) + '</span></div>' +
      (last.arm != null ? '<div class="health-row"><span class="health-label">זרוע</span><span class="health-val">' + last.arm + ' ס"מ' + trendTxt(meas.arm, false) + '</span></div>' : '') +
      (last.chest != null ? '<div class="health-row"><span class="health-label">חזה/ירך</span><span class="health-val">' + last.chest + ' ס"מ' + trendTxt(meas.chest, false) + '</span></div>' : '');
  }

  // ── הגדרות: קטע יעד מסתגל — זהה לחלוטין ל-renderAdaptiveSettings() המקורי. ──
  function renderAdaptiveSettings() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var r = AdaptiveTdeeDomain.adaptRate(userProfile);
    deps.documentRef.querySelectorAll('#set-adapt-rate .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.val === r); });
    var tog = deps.documentRef.getElementById('adapt-toggle');
    if (tog) tog.classList.toggle('on', AdaptiveTdeeDomain.adaptEnabled(userProfile));
    var info = deps.documentRef.getElementById('adapt-info');
    if (info) {
      var t = userProfile.adaptiveTdee;
      var last = userProfile.lastTdeeUpdate;
      info.innerHTML =
        '<div class="settings-row"><span>TDEE נלמד</span><span class="settings-val">' + (t ? t.toLocaleString() + ' קל׳' : 'לומד...') + '</span></div>' +
        '<div class="settings-row"><span>עודכן לאחרונה</span><span class="settings-val">' + (last ? 'לפני ' + DateUtils.daysBetween(DateUtils.getTodayKey(), last) + ' ימים' : '—') + '</span></div>';
    }
  }

  // זהה לחלוטין ל-setAdaptiveRate() המקורי.
  async function setAdaptiveRate(v) {
    var userProfile = deps.getUserProfile();
    if (!userProfile || !AdaptiveTdeeDomain.ADAPT_RATES[v]) return;
    userProfile.rate = v;
    deps.documentRef.querySelectorAll('#set-adapt-rate .seg-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.val === v); });
    await deps.saveProfile();
    await deps.runEngineAction('MANUAL', 'adaptiveTdeeEngine', 'ADAPTIVE_RECHECK');
  }

  // זהה לחלוטין ל-toggleAdaptive() המקורי.
  async function toggleAdaptive() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    userProfile.adaptiveEnabled = !AdaptiveTdeeDomain.adaptEnabled(userProfile);
    var tog = deps.documentRef.getElementById('adapt-toggle');
    if (tog) tog.classList.toggle('on', userProfile.adaptiveEnabled);
    await deps.saveProfile();
    await deps.runEngineAction('MANUAL', 'adaptiveTdeeEngine', 'ADAPTIVE_RECHECK');
  }

  var API = {
    configure: configure,
    runAdaptiveCheck: runAdaptiveCheck,
    renderAdaptiveCard: renderAdaptiveCard,
    coachAdaptiveMessage: coachAdaptiveMessage,
    applyAdaptiveUpdate: applyAdaptiveUpdate,
    dismissAdaptiveUpdate: dismissAdaptiveUpdate,
    renderPartialPrompt: renderPartialPrompt,
    confirmDayLight: confirmDayLight,
    logMeasurements: logMeasurements,
    renderMeasurements: renderMeasurements,
    renderAdaptiveSettings: renderAdaptiveSettings,
    setAdaptiveRate: setAdaptiveRate,
    toggleAdaptive: toggleAdaptive
  };

  if (typeof window !== 'undefined') { window.AdaptiveTdeeController = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
