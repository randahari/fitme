// ── GLOBALS ──
const APP_VERSION = '2.38.0';

// C1-WP2: מזריק את גורמי הפלטפורמה האמיתיים (auth/Notification/navigator/fetch) לתוך
// המתאמים. אותם אובייקטים גלובליים כמו קודם — רק דרך שכבת מתאם, לא ישירות.
AuthAdapter.configure({ auth: auth, googleProvider: googleProvider });
NotificationAdapter.configure({ notificationApi: (typeof Notification !== 'undefined' ? Notification : null), serviceWorkerContainer: (typeof navigator !== 'undefined' ? navigator.serviceWorker : null) });
ImageAdapter.configure();
BarcodeScannerAdapter.configure();
OpenFoodFactsClient.configure();
ClaudeProxyClient.configure();

// C1-WP3: מזריק את db (Firestore) האמיתי ואת serverTimestamp לתוך שכבת ה-Repository.
// אותו אובייקט db גלובלי כמו קודם — רק דרך שכבת repository, לא ישירות.
function _fsServerTimestamp() { return firebase.firestore.FieldValue.serverTimestamp(); }
ProfileRepository.configure({ db: db });
DayRepository.configure({ db: db, serverTimestamp: _fsServerTimestamp });
FavoritesRepository.configure({ db: db });
GroupRepository.configure({ db: db, serverTimestamp: _fsServerTimestamp });
BarcodeRepository.configure({ db: db, serverTimestamp: _fsServerTimestamp });

// עוזר לקריאת Claude דרך ה-proxy שלנו (בלי לדרוש מפתח API אישי)
async function callClaude(body) { return ClaudeProxyClient.send(body, currentUser); }

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };
const DAYS_HE = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];

// ── COACH (המאמן) ──
const COACH_STYLE_LABELS = { friendly: 'חברי', supportive: 'תומך', professional: 'מקצועי', mixed: 'מעורב' };
const COACH_CHATTER_LABELS = { minimal: 'קצר ולעניין', balanced: 'מאוזן', gentle: 'עדין' };
// C1-WP6: COACH_STYLE_GUIDE/COACH_CHATTER_GUIDE חולצו ל-js/coach/coachPromptComposer.js
// (משמשים רק את הרכבת הפרומפט, שם).
const ACHIEVEMENTS = [
  { id: 'streak7', icon: '🔥', title: '7 ימים ברצף', check: p => (p.streak||0) >= 7 },
  { id: 'streak30', icon: '🏆', title: '30 ימים ברצף', check: p => (p.streak||0) >= 30 },
  { id: 'workouts10', icon: '💪', title: '10 אימונים', check: p => (p.totalWorkouts||0) >= 10 },
  { id: 'workouts50', icon: '🥇', title: '50 אימונים', check: p => (p.totalWorkouts||0) >= 50 },
  { id: 'water7', icon: '💧', title: 'שבוע מים מושלם', check: p => (p.perfectWaterDays||0) >= 7 },
  { id: 'perfect7', icon: '🥗', title: 'שבוע תזונה מושלם', check: p => (p.perfectNutritionDays||0) >= 7 },
];

let currentUser = null;
let userProfile = null;
let todayData = { meals: [], burned: 0, steps: 0 };
let waterCount = 0;
// ── ניווט תאריך (שלב 2) ──
// currentDayKey = היום שמסך הבית מציג כרגע. todayData/waterCount מחזיקים את הנתונים שלו.
// realTodayData/realWaterCount שומרים תמיד את נתוני *היום האמיתי*, גם כשצופים ביום עבר.
let currentDayKey = getTodayKey();
let realTodayData = todayData;
let realWaterCount = 0;
let darkMode = false;
let workoutType = null;
let workoutInt = 'med';
let pendingMeal = null; // { name, note, items:[{name,amount,unit,kcal,protein,carbs,fat,fiber,sugar,sodium,qty}], suggestions:[...] }
let photoMode = 'plate'; // 'plate' = צילום צלחת, 'label' = צילום תווית תזונתית
let pendingBarcode = null; // הברקוד שצילום התווית הבא ישויך אליו במאגר הקבוצה
let obData = { gender: 'male', days: '2', goal: null, coachStyle: 'mixed', coachChatter: 'balanced' };
let quickItems = [];        // מנה 3 — רישום מהיר חכם
let coachCardShown = false; // כדי לא לייצר הודעת מאמן פעמיים באותה פתיחה
let foodSession = { originalInput: '', answers: [], questions: [], currentQ: 0 };
let favoriteMeals = [];

// ══════════════════════════════════════════════════════════════════
// ── REM-002: Session State Reset and Account Isolation ──
// app.js נרשם ל-SessionLifecycle עם ניקוי ה-state שהוא-עצמו הבעלים שלו בלבד
// (memory.js נרשם באופן עצמאי, בקובץ שלו). ה-cleanup הזה רץ בתוך reset(),
// שנקרא מ-auth.onAuthStateChanged — נקודת המחזור-חיים המרכזית היחידה.
// לפי §8 ב-SPEC: מכסה core session state, coach/AI state, nutrition state,
// engine state, ו-UI תלוי-משתמש. אינו נוגע בלוגיקת Habit/Pattern/Trigger/
// Adaptive TDEE עצמה — רק באיפוס ה-state התלוי-משתמש סביבן.
// ══════════════════════════════════════════════════════════════════
function _resetAppCoreState() {
  RuntimeState.resetForSession();
  waterCount = 0;
  currentDayKey = getTodayKey();
  realTodayData = todayData;
  realWaterCount = 0;
  darkMode = false;
  workoutType = null;
  workoutInt = 'med';
  pendingMeal = null;
  photoMode = 'plate';
  pendingBarcode = null;
  obData = { gender: 'male', days: '2', goal: null, coachStyle: 'mixed', coachChatter: 'balanced' };
  quickItems = [];
  coachCardShown = false;
  foodSession = { originalInput: '', answers: [], questions: [], currentQ: 0 };
  favoriteMeals = [];
  editingItemIdx = null;
  editingExisting = null;
  quickManage = false;
  _adaptProposal = null;
  window._adaptHistoryCache = null;
  // משאבי מצלמה/טיימרים חיים — עצירה בפועל, לא רק איפוס לוגי
  try { stopBarcodeReader(); } catch (e) {}
  try { closeBarcode(); } catch (e) {}
  try { closeLabelPrompt(); } catch (e) {}
  // ניקוי UI תלוי-משתמש (§5: "clear user-specific UI")
  ['coach-card', 'trigger-card', 'adaptive-card', 'partial-prompt'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}
SessionLifecycle.registerCleanup('app-core-state', _resetAppCoreState);

// ── AUTH ──
// C1-WP4: מכונת-המצבים של מעברי האימות (Session and Application Bootstrap) עברה ל-
// js/app/authSessionController.js. app.js מזריק closures (לא הפניות חשופות — loadUserData
// נעטף מאוחר יותר ב-Day Navigation IIFE, ראו docs/architecture/C1_WP0_INVENTORY.md §2.1)
// עבור כל תלות, כדי שהמודול יישאר בדיוק זהה בהתנהגות לקוד המקורי. ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP4.
RuntimeState.configure({
  getCurrentUser: function () { return currentUser; },
  setCurrentUser: function (u) { currentUser = u; },
  getProfile: function () { return userProfile; },
  setProfile: function (p) { userProfile = p; },
  getDisplayedDay: function () { return todayData; },
  setDisplayedDay: function (d) { todayData = d; }
});
BootstrapController.configure({
  profileRepository: ProfileRepository,
  dayRepository: DayRepository,
  favoritesRepository: FavoritesRepository
});
AuthSessionController.configure({
  authAdapter: AuthAdapter,
  sessionLifecycle: SessionLifecycle,
  runtimeState: RuntimeState,
  loadUserData: function () { return loadUserData(); },
  showApp: function () { showApp(); },
  showOnboarding: function () { showOnboarding(); },
  showLogin: function () { showLogin(); },
  initNotifications: function () { initNotifications(); },
  // REM-002: הרצה מחדש של בדיקת המיגרציה בכל סשן מאומת (לא רק בטעינת הדף הראשונה),
  // כדי שמשתמש B שמתחבר אחרי A באותו טאב יקבל גם הוא הזדמנות למיגרציה. אידמפוטנטי מטבעו.
  migrateIfNeeded: function () {
    if (window.FitMeMemory && typeof window.FitMeMemory.migrateIfNeeded === 'function') {
      window.FitMeMemory.migrateIfNeeded().catch(function (e) {
        try { console.warn('memory migration failed:', e && e.message); } catch (_) {}
      });
    }
  },
  // REM-001 §19 Invariant 9 / ER-006 — אין מועמד תזונתי חוצה-משתמשים ששורד sign-out/החלפת חשבון.
  // נשאר כאן במקביל ל-reset() המרכזי (כפילות בטוחה, לא מוסרת) — ראו גם _resetAppCoreState.
  onSignedOut: function () {
    pendingMeal = null;
    editingItemIdx = null;
    pendingBarcode = null;
    foodSession = { originalInput: '', answers: [], questions: [], currentQ: 0 };
  }
});
AuthSessionController.start();

// C1-WP5A: מזריק את callClaude/parseModelJSON כ-closures (לא הפניות חשופות — callClaude
// נעטף מאוחר יותר במונה שימוש, ראו "── Hooks: עטיפת פונקציות קיימות" בהמשך הקובץ), את
// NutritionOutputValidator (B1, קבוע), ואת showAiRejectedRecovery/showMealEditor כ-closures
// (showMealEditor נעטף מאוחר יותר ב-Day Navigation IIFE) — אלה כעת פסאדות ל-WP5C.
NutritionAnalysisService.configure({
  callClaude: function (body) { return callClaude(body); },
  parseModelJSON: function (raw) { return parseModelJSON(raw); },
  nutritionOutputValidator: window.NutritionOutputValidator,
  logValidation: function (status, sourceType, errorCodes) { logNutritionValidation(status, sourceType, errorCodes); },
  collectErrorCodes: function (gate) { return collectNutritionErrorCodes(gate); },
  onRejected: function (retryFn, meal) { showAiRejectedRecovery(retryFn, meal); },
  onValid: function (meal) { showMealEditor(meal); }
});

// C1-WP5C: מזריק גישת DOM (getElementById), את mealRequiresNutritionValidation/
// NutritionOutputValidator (משותפים גם עם addMeal ב-WP5D — אין שכפול לוגיקה), ואת
// showMealEditor/cancelFood/alert כ-closures (showMealEditor נעטף מאוחר יותר ב-Day
// Navigation IIFE) — כדי שהמודול תמיד יפעיל את ההגדרה הסופית-בזמן-ריצה.
MealEditorPresenter.configure({
  getElementById: function (id) { return document.getElementById(id); },
  mealRequiresNutritionValidation: function (meal) { return mealRequiresNutritionValidation(meal); },
  nutritionOutputValidator: window.NutritionOutputValidator,
  showMealEditor: function (meal) { showMealEditor(meal); },
  cancelFood: function () { cancelFood(); },
  clearPendingMeal: function () { pendingMeal = null; },
  alertFn: function (msg) { alert(msg); }
});

// C1-WP5D: מזריק closures לכל שלבי ה-commit המשותפים עם נקודות-כניסה אחרות —
// persistDaySnapshot (גם logQuick, WP5E), learnQuickItems (WP5E, קריאה בלבד — אין
// שכפול לוגיקת הלמידה), saveProfile/updateStreak (משותפים בין דומיינים רבים),
// saveBarcodeToCache (WP3), renderFoodMeals/renderQuickStrip/renderHome/renderEditor
// (חלקן עם override chains — closures, לא הפניות חשופות, מבטיחות תמיד את ההגדרה
// הסופית-בזמן-ריצה). SessionLifecycle/NutritionOutputValidator מוזרקים כהפניה
// חשופה — B1, קבועים, לעולם לא נעטפים.
MealCommitService.configure({
  mealRequiresNutritionValidation: function (meal) { return mealRequiresNutritionValidation(meal); },
  nutritionOutputValidator: window.NutritionOutputValidator,
  logValidation: function (status, sourceType, errorCodes) { logNutritionValidation(status, sourceType, errorCodes); },
  collectErrorCodes: function (gate) { return collectNutritionErrorCodes(gate); },
  saveBarcodeToCache: function (code, item, addedByName) { return saveBarcodeToCache(code, item, addedByName); },
  sessionLifecycle: SessionLifecycle,
  persistDaySnapshot: function (meals, burned, steps, water, authority, gen) { return persistDaySnapshot(meals, burned, steps, water, authority, gen); },
  learnQuickItems: function (meal) { learnQuickItems(meal); },
  clearPendingMeal: function () { pendingMeal = null; },
  getElementById: function (id) { return document.getElementById(id); },
  saveProfile: function () { return saveProfile(); },
  updateStreak: function () { return updateStreak(); },
  renderFoodMeals: function () { renderFoodMeals(); },
  renderQuickStrip: function () { renderQuickStrip(); },
  renderHome: function () { renderHome(); },
  renderEditor: function () { renderEditor(); },
  alertFn: function (msg) { alert(msg); }
});

// C1-WP5E: מזריק closures לתלויות המשותפות עם addMeal (WP5D) — persistDaySnapshot,
// SessionLifecycle/NutritionOutputValidator, saveProfile/updateStreak, renderFoodMeals/
// renderHome (אין renderQuickStrip — logQuick המקורי לא קרא לו, ולא משנים זאת) — אין
// שכפול לוגיקה. r1 מוזרק כדי ש-learnQuickItems ישתמש באותו עיגול כמו submitQuickLearn
// (נשאר ב-app.js, לא בסקופ WP5E).
QuickLogService.configure({
  nutritionOutputValidator: window.NutritionOutputValidator,
  logValidation: function (status, sourceType, errorCodes) { logNutritionValidation(status, sourceType, errorCodes); },
  collectErrorCodes: function (gate) { return collectNutritionErrorCodes(gate); },
  sessionLifecycle: SessionLifecycle,
  persistDaySnapshot: function (meals, burned, steps, water, authority, gen) { return persistDaySnapshot(meals, burned, steps, water, authority, gen); },
  alertFn: function (msg) { alert(msg); }
});

// C1-WP5F: מזריק closures ל-DOM ול-state המשותף עם app.js (showMealEditor — עטוף מאוחר יותר
// ע"י Day Navigation; startLabelCamera — WP5A/photo-flow; userProfile/pendingBarcode — state
// גלובלי משותף). BarcodeScannerAdapter/OpenFoodFactsClient/BarcodeRepository (WP2/WP3, יציבים)
// נדרשים ישירות בתוך המודול — אין שכפול לוגיקה.
BarcodeFlowController.configure({
  documentRef: document,
  alertFn: function (msg) { alert(msg); },
  sessionLifecycle: SessionLifecycle,
  showMealEditor: function (meal) { showMealEditor(meal); },
  startLabelCamera: function () { startLabelCamera(); },
  getUserProfile: function () { return userProfile; },
  setPendingBarcode: function (code) { pendingBarcode = code; }
});

// C1-WP6: מזריק goalLabels (קבוע משותף עם domains אחרים מחוץ ל-coach) ו-sessionLifecycle
// (עבור B5 Derived Intelligence session guard).
CoachPromptComposer.configure({
  sessionLifecycle: SessionLifecycle,
  goalLabels: GOAL_LABELS
});

// C1-WP6: מזריק closure ל-callClaude (עטוף מאוחר יותר למעקב שימוש — אותו דפוס בדיוק
// כמו NutritionAnalysisService.configure ב-WP5A).
CoachClient.configure({
  callClaude: function (body) { return callClaude(body); }
});

// C1-WP6: מזריק DOM/state/callbacks. coachMessageFn עוטף כ-closure את coachMessage
// (פסאדה ב-app.js המאצילה ל-CoachClient.sendMessage) — אין שכפול לוגיקה. coachCardShown
// נשאר משתנה משותף ב-app.js (מאופס גם ב-_resetAppCoreState) — מוזרק כ-getter/setter.
CoachPresenter.configure({
  documentRef: document,
  sessionLifecycle: SessionLifecycle,
  getUserProfile: function () { return userProfile; },
  getTodayData: function () { return todayData; },
  getCoachCardShown: function () { return coachCardShown; },
  setCoachCardShown: function (v) { coachCardShown = v; },
  saveProfile: function () { return saveProfile(); },
  coachMessageFn: function (context) { return coachMessage(context); }
});

// C1-WP7: מזריק DOM/state/callbacks. renderHome/renderSettings/runEngineAction עטופים
// כ-closures (renderHome/renderSettings נעטפים מאוחר יותר בקובץ — אותו כלל כמו בכל
// WP קודם). _adaptProposal נשאר משתנה משותף ב-app.js (הסטר שלו מוזרק ל-StateAccess דרך
// setAdaptProposal — B3 §§; ראה למטה) — מוזרק כ-getter/clearer. coachNameFn/coachMessageFn
// עוטפים את הפסאדות שכבר קיימות (WP6) — אין שכפול לוגיקה.
AdaptiveTdeeController.configure({
  documentRef: document,
  sessionLifecycle: SessionLifecycle,
  appVersion: APP_VERSION,
  daysHe: DAYS_HE,
  goalLabels: GOAL_LABELS,
  getUserProfile: function () { return userProfile; },
  getTodayData: function () { return todayData; },
  getCurrentUser: function () { return currentUser; },
  getAdaptProposal: function () { return _adaptProposal; },
  clearAdaptProposal: function () { _adaptProposal = null; },
  getAdaptHistoryCache: function () { return window._adaptHistoryCache; },
  saveProfile: function () { return saveProfile(); },
  renderHome: function () { renderHome(); },
  renderSettings: function () { renderSettings(); },
  runEngineAction: function (trigger, engineId, action, payload) { return runEngineAction(trigger, engineId, action, payload); },
  coachNameFn: function () { return coachName(); },
  coachMessageFn: function (context) { return coachMessage(context); },
  alertFn: function (msg) { alert(msg); }
});

// C1-WP8: מזריק DOM/state/callbacks. persistenceSummaryFn/scheduleAtFn/sendLocalNotificationFn
// עוטפים פסאדות/פונקציות משותפות קיימות (persistenceSummary משותף עם Habit/Pattern — B4 §27;
// scheduleAt/sendLocalNotification הן פסאדות WP2 קבועות) — אין שכפול לוגיקה.
// coachNameFn/coachMessageFn/coachLineFn עוטפים את הפסאדות שכבר קיימות (WP6).
TriggerController.configure({
  documentRef: document,
  sessionLifecycle: SessionLifecycle,
  goalLabels: GOAL_LABELS,
  getUserProfile: function () { return userProfile; },
  getTodayData: function () { return todayData; },
  persistenceSummaryFn: function (result) { return persistenceSummary(result); },
  scheduleAtFn: function (hour, min, callback) { return scheduleAt(hour, min, callback); },
  sendLocalNotificationFn: function (title, body) { return sendLocalNotification(title, body); },
  coachNameFn: function () { return coachName(); },
  coachMessageFn: function (context) { return coachMessage(context); },
  coachLineFn: function (kind, d) { return coachLine(kind, d); }
});

// C1-WP9: מזריק appVersion/sessionLifecycle/state getters/persistenceSummaryFn (המשותף עם
// Pattern/Trigger — B4 §27) לתוך ארבעת מודולי ה-engines/adapters. run (הנרשם מול
// EngineRegistry דרך RegisterEngines.registerAll(), למטה בקובץ) מגיע ישירות מכל מודול —
// אין שכפול לוגיקה. getCurrentUser/getUserProfile עוטפים closures זהים לאלה שכבר מוזרקים
// ל-AdaptiveTdeeController (WP7) — אין שכפול לוגיקה.
HabitEngine.configure({
  appVersion: APP_VERSION,
  sessionLifecycle: SessionLifecycle,
  getCurrentUser: function () { return currentUser; },
  getUserProfile: function () { return userProfile; },
  persistenceSummaryFn: function (result) { return persistenceSummary(result); }
});

PatternEngine.configure({
  appVersion: APP_VERSION,
  getCurrentUser: function () { return currentUser; },
  getUserProfile: function () { return userProfile; },
  persistenceSummaryFn: function (result) { return persistenceSummary(result); }
});

AdaptiveTdeeEngineAdapter.configure({
  sessionLifecycle: SessionLifecycle
});

TriggerEngineAdapter.configure({
  sessionLifecycle: SessionLifecycle,
  persistenceSummaryFn: function (result) { return persistenceSummary(result); }
});

function showLogin() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showOnboarding() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  if (darkMode) document.body.classList.add('dark');
  setTodayDate();
  renderHome();
  renderSettings();
  renderPlanBanner();
  buildWater();
  // buildWeekChart() מוסר כאן: renderHome() כבר קורא לו (ומונע קריאת היסטוריה כפולה ב-Cold Start). PERF-001
  runAppReadyEngines(); // B2: Engine Registry orchestration (Habit/Pattern/Adaptive TDEE/Trigger) — non-blocking
}

// signInWithGoogle מוגדר ב-firebase-config.js (redirect באייפון/PWA, popup בדסקטופ)

async function signOut() {
  if (confirm('להתנתק?')) await AuthAdapter.signOut();
}

// ── FIRESTORE ──
async function loadUserData() {
  if (!currentUser) return;
  const _gen = SessionLifecycle.getGeneration(); // REM-002: session guard
  try {
    // PERF-001: שלוש הקריאות עצמאיות — מונפקות במקביל (Promise.all) במקום טורית.
    // C1-WP4: מנגנון ה-fetch עצמו חי כעת ב-BootstrapController.loadUserSnapshot.
    const todayKey = getTodayKey();
    const [profileDoc, todayDoc, favDoc] = await BootstrapController.loadUserSnapshot(currentUser.uid, todayKey);
    if (!SessionLifecycle.isCurrent(_gen)) return; // REM-002: סשן הוחלף תוך כדי הטעינה — לא כותבים state ישן
    if (profileDoc.exists) {
      userProfile = profileDoc.data();
      darkMode = userProfile.darkMode || false;
      // מיגרציה חד-פעמית: מאחדים את זהות הקבוצה לשדה יחיד (groupId).
      // משתמשים ותיקים שיש להם רק groupCode — מעתיקים אותו ל-groupId.
      if (!userProfile.groupId && userProfile.groupCode) {
        userProfile.groupId = userProfile.groupCode;
        await saveProfile();
      }
    }
    if (todayDoc.exists) {
      const d = todayDoc.data();
      todayData = { meals: d.meals || [], burned: d.burned || 0, steps: d.steps || 0 };
      waterCount = d.water || 0;
    } else {
      todayData = { meals: [], burned: 0, steps: 0 };
      waterCount = 0;
    }
    // Load favorites (favDoc כבר נטען ב-Promise.all לעיל — PERF-001)
    favoriteMeals = favDoc.exists ? (favDoc.data().meals || []) : [];
    // Load quick-log items (מנה 3)
    quickItems = (userProfile && Array.isArray(userProfile.quickItems)) ? userProfile.quickItems : [];
  } catch(e) { console.error('loadUserData:', e); }
}

async function saveProfile() {
  if (!currentUser || !userProfile) return;
  try { await ProfileRepository.mergeProfile(currentUser.uid, userProfile); }
  catch(e) { console.error('saveProfile:', e); }
}

async function saveTodayData() {
  if (!currentUser) return;
  try {
    await DayRepository.saveLegacyDay(currentUser.uid, currentDayKey, {
      meals: todayData.meals, burned: todayData.burned, steps: todayData.steps, water: waterCount
    });
  } catch(e) { console.error('saveTodayData:', e); }
}

// B4 §33 item 5 / Engineering Readiness Review finding 4: הכתיבה הסופית (SOURCE_HISTORY_SAVE_DAY)
// עבור שני נקודות-הגבול הסמכותיות היחידות שכבר עוברות REM-001+REM-003 — addMeal()/logQuick().
// שאר קוראי saveTodayData() (מים, אימון, מועדפים) נשארים legacy מחוץ ל-scope (B4 §33: "MAY
// remain temporarily... documented"). authority משקף את הארוחה שזה עתה נוספה (כבר אומתה).
async function persistDaySnapshot(meals, burned, steps, water, authority, sessionGeneration) {
  if (!currentUser) return { status: 'REJECTED' };
  return await PersistenceGateway.persist({
    requestId: 'day-' + currentUser.uid + '-' + currentDayKey + '-' + Date.now(),
    operation: 'SOURCE_HISTORY_SAVE_DAY',
    domain: 'SOURCE_HISTORY',
    owner: 'nutritionHistoryState',
    userId: currentUser.uid,
    sessionGeneration: sessionGeneration,
    payload: { meals: meals, burned: burned, steps: steps, water: water },
    authority: authority,
    expectedVersion: null,
    idempotencyKey: null,
    createdAt: Date.now(),
    metadata: { engineId: null, trigger: 'USER_ACTION', runId: null }
  });
}

async function saveFavorites() {
  if (!currentUser) return;
  try { await FavoritesRepository.save(currentUser.uid, favoriteMeals); }
  catch(e) { console.error('saveFavorites:', e); }
}

// BUGFIX-001: orderBy(documentId(),'desc') דרש אינדקס single-field ידני ונכשל ב-failed-precondition,
// וה-catch הריק בלע את השגיאה — ההיסטוריה חזרה {} וכל הצרכנים קיבלו תמונה ריקה.
// המנגנון (קריאה בלי orderBy/limit, מיון+חיתוך ב-JS) חי כעת ב-DayRepository.fetchHistory —
// C1-WP3, ראה docs/specs/C1_SPEC_v1.0.md §C1-WP3.
async function getHistoryData() {
  if (!currentUser) return {};
  return DayRepository.fetchHistory(currentUser.uid);
}

async function getGroupMembers() {
  if (!currentUser || !userProfile || !userProfile.groupId) return [];
  return GroupRepository.getMembers(userProfile.groupId, currentUser.uid, getTodayKey());
}

// C1-WP1: מחולץ ל-js/core/dateUtils.js — פסאדה תואמת-לאחור, ללא שינוי התנהגות.
function dateKey(d) { return DateUtils.dateKey(d); }
function getTodayKey() { return DateUtils.getTodayKey(); }
function generateGroupCode() { return Math.random().toString(36).substr(2,6).toUpperCase(); }

// ── NOTIFICATIONS ── C1-WP2: מנגנוני הפלטפורמה עברו ל-NotificationAdapter; שאלת
// היכולת הבסיסית ('Notification' in window) נשארת כאן (שער כניסה, לא מנגנון להזרקה).
async function initNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (NotificationAdapter.getPermission() === 'default') {
    setTimeout(() => requestNotificationPermission(), 3000);
  }
  runAuthSessionReadyEngines(); // B2: Trigger Engine — AUTH_SESSION_READY / LOCAL_NOTIFICATION_SCHEDULE
}

async function requestNotificationPermission() {
  const perm = await NotificationAdapter.requestPermission();
  if (perm === 'granted') {
    sendLocalNotification('FitMe 💪', 'התראות הופעלו! נשלח לך תזכורות יומיות.');
  }
}

function sendLocalNotification(title, body) {
  return NotificationAdapter.showNotification(title, body);
}

// B2: scheduleLocalNotifications() consolidated to a single definition — see the
// Trigger Engine adapter section near the end of this file (previously this name
// had a base definition here plus a full replacement later in the file).

function scheduleAt(hour, min, callback) { return NotificationAdapter.scheduleAt(hour, min, callback); }

// ── COACH ENGINE (המאמן) — C1-WP6: חולץ ל-js/coach/{coachProfile,coachPromptComposer,
// coachClient,coachPresenter}.js — פסאדות תואמות-לאחור. buildCoachSystemPrompt מאחדת
// כעת (בתוך CoachPromptComposer.buildSystemPrompt) את שתי השכבות ההיסטוריות שהיו קיימות
// כאן (ההגדרה הבסיסית הסינכרונית + ה-override האסינכרוני שהזריק B5) — ראה
// tests/c1Wp6Wiring.test.js/tests/coachPromptComposer.test.js להשוואה מול המקור.
function coachName() { return CoachProfile.coachName(userProfile); }
function coachStyle() { return CoachProfile.coachStyle(userProfile); }
function coachChatter() { return CoachProfile.coachChatter(userProfile); }
async function buildCoachSystemPrompt() { return CoachPromptComposer.buildSystemPrompt(userProfile, todayData, currentUser); }
async function coachMessage(context) { return CoachClient.sendMessage(context, userProfile, todayData, currentUser); }
async function refreshCoachCard() { return CoachPresenter.refreshCoachCard(); }
function coachLine(kind, d) { return CoachPromptComposer.coachLine(userProfile, kind, d); }

// ── ONBOARDING ──
function selectSeg(btn, group) {
  btn.closest('.seg-ctrl').querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  obData[group] = btn.dataset.val;
}

function selectGoal(card) {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  obData.goal = card.dataset.goal;
}

function toggleTag(el) { el.classList.toggle('selected'); }

function addCustomFood() {
  const input = document.getElementById('custom-food');
  const val = input.value.trim();
  if (!val) return;
  const tag = document.createElement('div');
  tag.className = 'food-tag selected';
  tag.textContent = val;
  tag.onclick = () => toggleTag(tag);
  document.getElementById('food-tags').appendChild(tag);
  input.value = '';
}

function obNext(step) {
  if (step === 1) {
    const name = document.getElementById('ob-name').value.trim();
    const age = document.getElementById('ob-age').value;
    if (!name || !age) { alert('נא למלא את כל השדות'); return; }
    obData.name = name; obData.age = parseInt(age);
  }
  if (step === 2) {
    const w = document.getElementById('ob-weight').value;
    const h = document.getElementById('ob-height').value;
    if (!w || !h) { alert('נא למלא את כל השדות'); return; }
    obData.weight = parseFloat(w); obData.height = parseFloat(h);
  }
  if (step === 3) { if (!obData.goal) { alert('נא לבחור מטרה'); return; } }
  if (step === 4) {
    const foods = [...document.querySelectorAll('.food-tag.selected')].map(t => t.textContent);
    if (!foods.length) { alert('בחר לפחות מאכל אחד'); return; }
    obData.foods = foods;
    // מילוי אוטומטי של שם הפנייה מהשם שהוזן
    const cn = document.getElementById('ob-coach-name');
    if (cn && !cn.value.trim()) cn.value = obData.name || '';
  }
  document.getElementById('ob-' + step).classList.remove('active');
  document.getElementById('ob-' + (step + 1)).classList.add('active');
}

function obBack(step) {
  document.getElementById('ob-' + step).classList.remove('active');
  document.getElementById('ob-' + (step - 1)).classList.add('active');
}

async function finishOnboarding() {
  const foods = obData.foods || [...document.querySelectorAll('.food-tag.selected')].map(t => t.textContent);
  if (!foods.length) { alert('בחר לפחות מאכל אחד'); return; }
  const coachNameVal = (document.getElementById('ob-coach-name')?.value || '').trim() || obData.name;
  const bmr = obData.gender === 'male'
    ? 88.36 + (13.4*obData.weight) + (4.8*obData.height) - (5.7*obData.age)
    : 447.6 + (9.2*obData.weight) + (3.1*obData.height) - (4.3*obData.age);
  const mult = obData.days==='2' ? 1.375 : obData.days==='4' ? 1.55 : 1.725;
  const tdee = Math.round(bmr * mult);
  const goalKcal = obData.goal==='cut' ? tdee-400 : obData.goal==='bulk' ? tdee+300 : tdee;
  const groupCode = generateGroupCode();
  userProfile = {
    name: obData.name, age: obData.age, gender: obData.gender, weight: obData.weight,
    height: obData.height, days: obData.days, goal: obData.goal, foods, tdee, goalKcal,
    stepsGoal: 10000, streak: 0, darkMode: false, groupCode, groupId: groupCode,
    totalWorkouts: 0, perfectWaterDays: 0, perfectNutritionDays: 0,
    coachName: coachNameVal, coachStyle: obData.coachStyle || 'mixed', coachChatter: obData.coachChatter || 'balanced',
    quickItems: [], quickOnboarded: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  quickItems = [];
  await saveProfile();
  await GroupRepository.addMember(groupCode, currentUser.uid);
  todayData = { meals: [], burned: 0, steps: 0 }; waterCount = 0;
  showApp();
  initNotifications();
}

// ── HOME ──
function setTodayDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  const d = new Date();
  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  el.textContent = 'יום ' + days[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth()+1);
}

function renderHome() {
  if (!userProfile) return;
  document.getElementById('greeting').textContent = 'שלום, ' + userProfile.name + '!';
  setTodayDate();
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  const target = userProfile.goalKcal;
  const pct = Math.min(100, Math.round(consumed/target*100));
  document.getElementById('kcal-consumed').textContent = consumed.toLocaleString();
  document.getElementById('kcal-target').textContent = target.toLocaleString();
  document.getElementById('kcal-bar').style.width = pct + '%';
  document.getElementById('kcal-remain').textContent = 'נותרו ' + Math.max(0,target-consumed).toLocaleString() + ' קל\'';
  document.getElementById('m-protein').textContent = Math.round(todayData.meals.reduce((s,m)=>s+(m.protein||0),0)) + 'g';
  document.getElementById('m-carbs').textContent = Math.round(todayData.meals.reduce((s,m)=>s+(m.carbs||0),0)) + 'g';
  document.getElementById('m-fat').textContent = Math.round(todayData.meals.reduce((s,m)=>s+(m.fat||0),0)) + 'g';
  document.getElementById('burned-val').textContent = (todayData.burned||0).toLocaleString();
  document.getElementById('steps-val').textContent = (todayData.steps||0).toLocaleString();
  document.getElementById('weight-val').textContent = userProfile.currentWeight || userProfile.weight || '--';
  document.getElementById('streak-num').textContent = userProfile.streak || 0;
  renderMealsInHome();
  buildWater();
  buildWeekChart();
}

function renderMealsInHome() {
  const list = document.getElementById('meals-list');
  if (!todayData.meals.length) { list.innerHTML = '<div class="empty-state">לא נרשמו ארוחות עדיין</div>'; return; }
  list.innerHTML = '<div class="meals-card">' + todayData.meals.map(m =>
    `<div class="meal-row"><div><div class="meal-name">${m.name}</div><div class="meal-time">${m.time}</div></div><div class="meal-kcal">${m.kcal} קל'</div></div>`
  ).join('') + '</div>';
}

// ── WATER ──
function buildWater() {
  const el = document.getElementById('water-cups');
  if (!el) return;
  el.innerHTML = '';
  for (let i=0; i<8; i++) {
    const cup = document.createElement('div');
    cup.className = 'water-cup' + (i < waterCount ? ' filled' : '');
    cup.textContent = '💧';
    cup.onclick = async () => { waterCount = i+1; buildWater(); document.getElementById('water-text').textContent = waterCount+' / 8'; await saveTodayData(); };
    el.appendChild(cup);
  }
  const txt = document.getElementById('water-text');
  if (txt) txt.textContent = waterCount + ' / 8';

}

// ── WEEK CHART ──
async function buildWeekChart() {
  const el = document.getElementById('week-chart');
  if (!el) return;
  el.innerHTML = '';
  const history = await getHistoryData();
  const today = new Date();
  // בדיוק 7 ימים
  for (let i=6; i>=0; i--) {
    const d = new Date(today); d.setDate(today.getDate()-i);
    const key = dateKey(d);
    const isToday = i===0;
    const dayData = isToday ? realTodayData : (history[key]||null);
    const kcal = dayData ? (dayData.meals||[]).reduce((s,m)=>s+(m.kcal||0),0) : 0;
    const target = userProfile ? userProfile.goalKcal : 2000;
    const pct = target>0 ? Math.min(100,Math.round(kcal/target*100)) : 0;
    const metGoal = kcal >= target*0.85;
    const col = document.createElement('div');
    col.className = 'week-col';
    col.innerHTML = `<div class="week-bar-fill ${isToday?'today':(metGoal&&kcal>0?'goal-met':'')}" style="height:${Math.max(4,Math.round(pct*0.5))}px"></div><div class="week-day">${DAYS_HE[d.getDay()]}</div>`;
    el.appendChild(col);
  }
}

async function logWeight() {
  const val = parseFloat(document.getElementById('weight-input').value);
  if (!val||val<20||val>300) { alert('משקל לא תקין'); return; }
  userProfile.currentWeight = val;
  if (!userProfile.weightHistory) userProfile.weightHistory = [];
  userProfile.weightHistory.push({ date: getTodayKey(), weight: val });
  document.getElementById('weight-input').value = '';
  await saveProfile();
  renderHome();
  await runEngineAction('SOURCE_DATA_CHANGED', 'adaptiveTdeeEngine', 'WEIGHT_CHANGED');
}

// ── FOOD ──
function goToScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  
  if (name==='home') renderHome();
  if (name==='food') { renderFoodMeals(); renderFavoritesList(); }
  
  
  if (name==='profile') renderProfile();
  
}

async function analyzeFood() {
  const input = document.getElementById('food-input').value.trim();
  if (!input) return;
  foodSession = { originalInput: input, answers: [], questions: [], currentQ: 0 };
  document.getElementById('food-loading').classList.remove('hidden');
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-questionnaire').classList.add('hidden');
  try {
    const parsed = await NutritionAnalysisService.requestQuestionnaire(input);
    foodSession.questions = parsed.questions;
    showNextQuestion();
  } catch(e) { alert('שגיאה: ' + e.message); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

function showNextQuestion() {
  const q = foodSession.questions[foodSession.currentQ];
  if (!q) { calculateFoodResult(); return; }
  const total = foodSession.questions.length;
  const current = foodSession.currentQ + 1;
  const dots = Array.from({length:total},(_,i)=>`<div class="q-dot ${i<foodSession.currentQ?'done':i===foodSession.currentQ?'active':''}"></div>`).join('');
  const opts = q.options.map(opt=>`<button class="q-opt-btn" onclick="answerQuestion('${opt.replace(/'/g,"\\'")}')"><span class="q-opt-text">${opt}</span><span class="q-opt-arrow">›</span></button>`).join('');
  document.getElementById('food-questionnaire').innerHTML = `<div class="q-progress">${dots}<span class="q-counter">${current}/${total}</span></div><div class="q-title">${q.q}</div><div class="q-opts">${opts}</div><button class="q-skip" onclick="answerQuestion('לא ידוע')">דלג</button>`;
  document.getElementById('food-questionnaire').classList.remove('hidden');
}

function answerQuestion(answer) {
  foodSession.answers.push({ q: foodSession.questions[foodSession.currentQ].q, a: answer });
  foodSession.currentQ++;
  document.querySelectorAll('.q-opt-btn').forEach(b=>b.style.opacity='0.5');
  setTimeout(()=>showNextQuestion(), 200);
}

// C1-WP5A: ITEMS_JSON_SPEC חולץ ל-NutritionAnalysisService.ITEMS_JSON_SPEC.

// ══════════════════════════════════════════════════════════════════
// ── REM-001: LLM Nutrition Output Validation Layer — integration glue ──
// שכבת האימות עצמה (window.NutritionOutputValidator) חיה ב-js/nutritionValidator.js
// (רכיב טהור, ללא UI/פרסיסטנס/קריאות LLM — REM-001 §7). כאן רק ניתוב + UI מינימלי.
// מקורות 'off'/'group' (התאמת ברקוד ממאגר) ו-'manual' (בנייה ידנית מאפס אחרי דחייה)
// אינם תוצר AI ואינם בסקופ (REM-001 §3/§4 — "לא לשנות לוגיקת מאגר ברקוד").
// ══════════════════════════════════════════════════════════════════
const NUTRITION_VALIDATION_EXEMPT_SOURCES = ['off', 'group', 'manual'];
function mealRequiresNutritionValidation(meal) {
  const src = meal && meal.source;
  return NUTRITION_VALIDATION_EXEMPT_SOURCES.indexOf(src) < 0;
}

// REM-003 §Recommended Additions — Authority Metadata: מקור הסמכות של רשומת ארוחה סמכותית.
// משתמש באותה סיווג-מקור הקיים כבר מ-REM-001 (mealRequiresNutritionValidation), כדי שלא
// תיווצר טקסונומיה שנייה. 'text'/'photo'/'label' = הצעת AI שנסקרה ואושרה ע"י המשתמש בעורך;
// 'off'/'group'/'manual' = התאמת מאגר/הזנה ידנית שהמשתמש אישר במישרין — לא הערכת AI.
function authoritySourceForMeal(meal) {
  const src = meal && meal.source;
  if (NUTRITION_VALIDATION_EXEMPT_SOURCES.indexOf(src) >= 0) {
    return window.AuthorityContract.AUTHORITY_SOURCES.USER_DECLARATION;
  }
  return window.AuthorityContract.AUTHORITY_SOURCES.USER_CONFIRMED_AI_ESTIMATE;
}

// §17 Logging and Observability — ללא תוכן ארוחה/פרומפט/תמונה/טוקנים, רק תוצאת האימות.
function collectNutritionErrorCodes(gate) {
  const codes = [];
  (gate.itemResults || []).forEach(r => (r.errors || []).forEach(e => codes.push(e.code)));
  (gate.aggregateResult ? gate.aggregateResult.errors : []).forEach(e => codes.push(e.code));
  return codes;
}
function logNutritionValidation(status, sourceType, errorCodes) {
  try {
    const v = window.NutritionOutputValidator;
    console.info('[nutritionValidation]', {
      status, sourceType, errorCodes: errorCodes || [], warningCodes: [],
      validatorVersion: (v && v.VERSION) || 'unknown'
    });
  } catch (e) {}
}

// שער ראשון (REM-001 §15/ER-001): מיד אחרי parseModelJSON, לפני שהעורך נפתח בכלל.
// meal: {name, items, suggestions, note, source?}. retryFn: הרצה חוזרת של הניתוח המקורי.
// C1-WP5A: הניתוב עצמו חולץ ל-NutritionAnalysisService.routeMeal — פסאדה תואמת-לאחור.
function routeAiMeal(meal, sourceType, retryFn) {
  return NutritionAnalysisService.routeMeal(meal, sourceType, retryFn);
}

// §14.3 — REJECTED: נתיב התאוששות ברור (נסה שוב / הזן ידנית / בטל), בלי קוד טכני למשתמש.
// C1-WP5C: חולץ ל-MealEditorPresenter.showAiRejectedRecovery — פסאדה תואמת-לאחור.
function showAiRejectedRecovery(retryFn, originalMeal) {
  return MealEditorPresenter.showAiRejectedRecovery(retryFn, originalMeal, foodSession && foodSession.originalInput);
}

async function calculateFoodResult() {
  document.getElementById('food-questionnaire').classList.add('hidden');
  document.getElementById('food-loading').classList.remove('hidden');
  const answersText = foodSession.answers.map(a=>`${a.q}: ${a.a}`).join(', ');
  const _gen = SessionLifecycle.getGeneration(); // REM-002: session guard
  try {
    const meal = await NutritionAnalysisService.requestCalculation(foodSession.originalInput, answersText);
    if (!SessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי קריאת ה-AI
    meal.source = meal.source || 'text';
    routeAiMeal(meal, 'text', calculateFoodResult);
  } catch(e) { alert('שגיאה בחישוב.'); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

function startCamera() { photoMode = 'plate'; ImageAdapter.triggerFileInput('camera-input'); }
function startLabelCamera() { photoMode = 'label'; ImageAdapter.triggerFileInput('camera-input'); }

// C1-WP5A: PLATE_PROMPT/LABEL_PROMPT חולצו ל-NutritionAnalysisService.

// C1-WP2: מחולץ ל-js/adapters/imageAdapter.js — פסאדה תואמת-לאחור, ללא שינוי התנהגות.
function compressImageForUpload(file, maxDim, quality) { return ImageAdapter.compressImageForUpload(file, maxDim, quality); }

async function analyzePhoto(input) {
  const file = input.files[0]; if (!file) return;
  input.value = '';
  document.getElementById('food-loading').classList.remove('hidden');
  document.getElementById('food-result').classList.add('hidden');
  const mode = photoMode; photoMode = 'plate';
  const _gen = SessionLifecycle.getGeneration(); // REM-002: session guard
  try {
    const img = await compressImageForUpload(file);
    const meal = await NutritionAnalysisService.requestPhotoAnalysis(mode, img.b64, img.mediaType);
    if (!SessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי הניתוח
    if (meal.error) { alert('לא הצלחתי לקרוא את התווית. נסה לצלם שוב מקרוב, באור טוב.'); return; }
    if (mode === 'label') {
      // צילום תווית שהגיע ממסלול ברקוד — נשייך את הברקוד כדי שהתיקון יישמר למאגר הקבוצה
      meal.source = 'label';
      meal.barcode = pendingBarcode;
      pendingBarcode = null;
    } else {
      meal.source = 'plate';
    }
    routeAiMeal(meal, mode === 'label' ? 'label' : 'photo', () => { if (mode === 'label') startLabelCamera(); else startCamera(); });
  } catch(e) { alert('שגיאה בניתוח התמונה: ' + e.message); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

// ── BARCODE SCANNER — C1-WP5F: חולץ ל-BarcodeFlowController — פסאדות תואמות-לאחור.
// h5qr/barcodeLastCode/barcodeHintTimer עברו להיות state פרטי של המודול (לא נקראים
// משום מקום אחר ב-app.js).
async function startBarcode() { return BarcodeFlowController.startBarcode(); }
function onBarcodeDetected(code, statusEl) { return BarcodeFlowController.onBarcodeDetected(code, statusEl); }
function armBarcodeHint(statusEl) { return BarcodeFlowController.armBarcodeHint(statusEl); }
function barcodeToLabel() { return BarcodeFlowController.barcodeToLabel(); }
function stopBarcodeReader() { return BarcodeFlowController.stopBarcodeReader(); }
function closeBarcode() { return BarcodeFlowController.closeBarcode(); }

// ── בקשת צילום תווית (label fallback) — C1-WP5F: חולץ ל-BarcodeFlowController.
function showLabelPrompt(code) { return BarcodeFlowController.showLabelPrompt(code); }
function labelPromptCapture() { return BarcodeFlowController.labelPromptCapture(); }
function closeLabelPrompt() { return BarcodeFlowController.closeLabelPrompt(); }

// ── מאגר ברקוד משותף לקבוצה — C1-WP5F: חולץ ל-BarcodeFlowController.
function getSharedBarcodeGroup() { return BarcodeFlowController.getSharedBarcodeGroup(); }
async function lookupBarcodeInCache(code) { return BarcodeFlowController.lookupBarcodeInCache(code); }
async function saveBarcodeToCache(code, item, existingAddedByName) { return BarcodeFlowController.saveBarcodeToCache(code, item, existingAddedByName); }
async function lookupBarcode(code) { return BarcodeFlowController.lookupBarcode(code); }

// ── מסך עריכה אחיד (תמונה / ברקוד / הקלדה) ──
// C1-WP1: מחולצים ל-js/core/stringUtils.js, js/core/numberUtils.js, js/core/jsonUtils.js,
// js/domain/nutritionModel.js — פסאדות תואמות-לאחור, ללא שינוי התנהגות.
function esc(s) { return StringUtils.esc(s); }
function num(v) { return NumberUtils.num(v); }
function parseModelJSON(raw) { return JsonUtils.parseModelJSON(raw); }
function normalizeItem(it) { return NutritionModel.normalizeItem(it); }

let editingItemIdx = null;
let editingExisting = null; // {idx, time} כשעורכים ארוחה שכבר נרשמה (שלב 2)
function showMealEditor(meal) {
  editingItemIdx = null;
  pendingMeal = MealDraft.buildDraft(meal);
  renderEditor();
  document.getElementById('food-result').classList.remove('hidden');
}

// ── תג מקור המידע (מאגר עולמי / תווית / מאגר קבוצה) ──
// C1-WP5C: חולץ ל-MealEditorPresenter.sourceBadge — פסאדה תואמת-לאחור.
function sourceBadge() {
  return MealEditorPresenter.sourceBadge(pendingMeal);
}

function mealTotals() {
  return MealDraft.computeTotals(pendingMeal ? pendingMeal.items : []);
}

// C1-WP5C: חולץ ל-MealEditorPresenter.fmtQty — פסאדה תואמת-לאחור.
function fmtQty(q) { return MealEditorPresenter.fmtQty(q); }

// REM-001 §16/ER-004 — "Validation banner": מחושב חי מתוך המצב הנוכחי של pendingMeal.items,
// כך שהוספה/עריכה/מחיקה של פריט משקפות את הבאנר מיד, בלי דגל נפרד שעלול להתיישן.
// C1-WP5C: חולץ ל-MealEditorPresenter.nutritionValidationBanner — פסאדה תואמת-לאחור.
function nutritionValidationBanner() {
  return MealEditorPresenter.nutritionValidationBanner(pendingMeal);
}

// C1-WP5C: חולץ ל-MealEditorPresenter.renderEditor — פסאדה תואמת-לאחור.
function renderEditor() {
  MealEditorPresenter.renderEditor(pendingMeal, editingItemIdx);
}

function editorQty(i, dir) {
  const it = pendingMeal.items[i]; if (!it) return;
  MealDraft.changeQty(it, dir);
  renderEditor();
}

function editorEdit(i) {
  editingItemIdx = i;
  renderEditor();
}

function editorCancelEdit() {
  editingItemIdx = null;
  renderEditor();
}

function editorSaveEdit(i) {
  const it = pendingMeal.items[i]; if (!it) return;
  const g = id => document.getElementById(id);
  MealDraft.applyEdit(it, {
    name: (g('edit-name').value || 'פריט').trim(),
    amount: num(g('edit-amount').value),
    unit: g('edit-unit').value.trim(),
    kcal: num(g('edit-kcal').value),
    protein: num(g('edit-protein').value),
    carbs: num(g('edit-carbs').value),
    fat: num(g('edit-fat').value),
    fiber: num(g('edit-fiber').value),
    sugar: num(g('edit-sugar').value),
    sodium: num(g('edit-sodium').value)
  });
  editingItemIdx = null;
  renderEditor();
}

function editorDelete(i) {
  MealDraft.removeItem(pendingMeal.items, i);
  renderEditor();
}

function editorAddSuggestion(i) {
  MealDraft.promoteSuggestion(pendingMeal.items, pendingMeal.suggestions, i);
  renderEditor();
}

async function editorAddCustom() {
  const input = document.getElementById('ed-add-input');
  const val = input.value.trim(); if (!val) return;
  const btn = document.getElementById('ed-add-btn');
  btn.disabled = true; btn.textContent = '...';
  const _gen = SessionLifecycle.getGeneration(); // REM-002: session guard
  try {
    const it = await NutritionAnalysisService.requestItemEstimate(val);
    if (!SessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי הקריאה ל-AI (pendingMeal כבר אינו רלוונטי)
    // REM-001 §15/ER-002 — "meal editor AI item insertion": פריט בודד, אימות ראשון מיד אחרי הפענוח,
    // בלתי-תלוי במקור pendingMeal הכולל (גם אם עורכים מנה שהגיעה מברקוד, הפריט החדש הזה כן AI טרי).
    const gate = window.NutritionOutputValidator.validateNutritionMeal([it], 'editor-item');
    logNutritionValidation(gate.overallStatus, 'editor-item', collectNutritionErrorCodes(gate));
    if (gate.overallStatus === 'REJECTED') {
      alert('אני לא בטוח בערכים של הפריט הזה. נסה לתאר אותו אחרת, או הוסף את הערכים ידנית.');
      btn.disabled = false; btn.textContent = 'הוסף';
      return;
    }
    pendingMeal.items.push(normalizeItem(it));
    input.value = '';
    btn.disabled = false; btn.textContent = 'הוסף';
    renderEditor();
  } catch(e) { alert('שגיאה: ' + e.message); btn.disabled = false; btn.textContent = 'הוסף'; }
}

// REM-003 §9/Recommended Additions — Authority Metadata + Audit Trail. נצמד כאן (מקום יחיד),
// כך ש-addMeal() וגם saveFavoriteFromPending() (ששניהם קוראים לפונקציה הזו) יורשים אותו באופן עקבי.
// C1-WP5B: החישוב/העיגול/בניית האובייקט חולצו ל-MealDraft.buildAuthoritativeMeal — פסאדה
// תואמת-לאחור, מזרימה אותם ערכים בדיוק (authoritySourceForMeal/currentUser/APP_VERSION).
function buildMealFromEditor() {
  return MealDraft.buildAuthoritativeMeal(pendingMeal, {
    authoritySource: authoritySourceForMeal(pendingMeal),
    createdByUid: currentUser && currentUser.uid,
    systemVersion: APP_VERSION
  });
}

// C1-WP5D: חולץ ל-MealCommitService.commitMeal — פסאדה תואמת-לאחור. authorityOptions
// זהה לחלוטין למה ש-buildMealFromEditor() כבר מזריק (authoritySourceForMeal/currentUser/APP_VERSION).
async function addMeal() {
  return MealCommitService.commitMeal(pendingMeal, todayData, waterCount, {
    authoritySource: authoritySourceForMeal(pendingMeal),
    createdByUid: currentUser && currentUser.uid,
    systemVersion: APP_VERSION
  });
}

async function addMealAndFavorite() {
  if (!pendingMeal || !pendingMeal.items.length) return;
  // בדיקה מקדימה בלבד (ללא מוטציה): אם השער השני ידחה, לא שומרים כמועדף — addMeal() עצמו יבצע
  // את הבדיקה האמיתית ויציג משוב; כך פריט לא-תקין לעולם לא הופך למועדף (REM-001 ER-001).
  if (mealRequiresNutritionValidation(pendingMeal)) {
    const precheck = window.NutritionOutputValidator.validateNutritionMeal(pendingMeal.items, pendingMeal.source || 'text');
    if (precheck.overallStatus !== 'VALID') { await addMeal(); return; }
  }
  await saveFavoriteFromPending();
  await addMeal();
}

async function saveFavoriteFromPending() {
  if (!pendingMeal) return;
  const exists = favoriteMeals.find(f => f.name === pendingMeal.name);
  if (!exists) {
    const m = buildMealFromEditor();
    delete m.time;
    favoriteMeals.push({ ...m, savedAt: new Date().toISOString() });
    await saveFavorites();
    renderFavoritesList();
  }
}

async function addFavoriteToToday(idx) {
  const meal = favoriteMeals[idx];
  if (!meal) return;
  const now = new Date();
  todayData.meals.push({ ...meal, time: now.getHours()+':'+String(now.getMinutes()).padStart(2,'0') });
  await saveTodayData();
  await updateStreak();
  renderFoodMeals();
  renderHome();
  // Feedback
  const btn = document.querySelectorAll('.fav-add-btn')[idx];
  if (btn) { btn.textContent = '✓'; btn.style.background = '#1D9E75'; setTimeout(() => { btn.textContent = '+'; btn.style.background = ''; }, 1500); }
}

async function removeFavorite(idx) {
  favoriteMeals.splice(idx, 1);
  await saveFavorites();
  renderFavoritesList();
}

function renderFavoritesList() {
  const el = document.getElementById('favorites-list');
  if (!el) return;
  if (!favoriteMeals.length) { el.innerHTML = '<div class="empty-state">אין עדיין מועדפים<br><small>לחץ ⭐ בעת הוספת מאכל</small></div>'; return; }
  el.innerHTML = '<div class="meals-card">' + favoriteMeals.map((m,i) =>
    `<div class="meal-row"><div><div class="meal-name">${m.name}</div><div class="meal-time">${m.kcal} קל' · ${Math.round(m.protein)}g חלבון</div></div><div style="display:flex;gap:6px;align-items:center"><button class="fav-add-btn btn-small" onclick="addFavoriteToToday(${i})">+</button><button onclick="removeFavorite(${i})" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:16px">×</button></div></div>`
  ).join('') + '</div>';
}

function cancelFood() {
  pendingMeal = null;
  pendingBarcode = null;
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-input').value = '';
}

// ── QUICK LOG (מנה 3 — רישום מהיר חכם) ──
let quickManage = false;
function r1(x) { return Math.round((+x || 0) * 10) / 10; }
function qval(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

// C1-WP5E: חולץ ל-QuickLogService.learnQuickItems — פסאדה תואמת-לאחור. r1 מוזרק (עוגן
// משותף עם submitQuickLearn, שנשאר כאן ומשתמש ב-r1 ישירות). השומר (guard) נשאר גם כאן,
// זהה למקור — כדי שלא תתבצע כלל הקצאת userProfile.quickItems כשה-meal לא תקין.
function learnQuickItems(meal) {
  if (!meal || !Array.isArray(meal.items)) return;
  quickItems = QuickLogService.learnQuickItems(meal, quickItems, r1);
  if (userProfile) userProfile.quickItems = quickItems;
}

// C1-WP5E: חולץ ל-QuickLogService.capQuick — פסאדה תואמת-לאחור.
function capQuick() {
  quickItems = QuickLogService.capQuick(quickItems);
}

// ניקוד חכם: תדירות + התאמה לשעה + טריות + נעיצה
// C1-WP5E: חולץ ל-QuickLogService.scoreQuick — פסאדה תואמת-לאחור.
function scoreQuick(q) { return QuickLogService.scoreQuick(q); }

function renderQuickStrip() {
  const sec = document.getElementById('quick-section');
  const wrap = document.getElementById('quick-strip');
  if (!sec || !wrap) return;
  if (!quickItems.length) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  const sorted = [...quickItems].sort((a,b) => scoreQuick(b) - scoreQuick(a));
  const list = quickManage ? sorted : sorted.slice(0, 10);
  wrap.innerHTML = list.map(q => {
    const gi = quickItems.indexOf(q);
    if (quickManage) {
      return `<div class="quick-chip manage"><span>${esc(q.name)}</span>
        <button class="quick-pin ${q.pinned?'on':''}" onclick="pinQuick(${gi})" title="נעץ">📌</button>
        <button class="quick-del" onclick="removeQuick(${gi})" title="הסר">×</button></div>`;
    }
    return `<button class="quick-chip" onclick="logQuick(${gi}, this)">${q.pinned?'📌 ':''}${esc(q.name)} <span>${q.kcal}</span></button>`;
  }).join('');
}

function toggleQuickManage() {
  quickManage = !quickManage;
  const btn = document.getElementById('quick-manage-btn');
  if (btn) btn.textContent = quickManage ? 'סיום' : 'ערוך';
  renderQuickStrip();
}

// C1-WP5E: חולץ ל-QuickLogService.commitQuickItem — פסאדה תואמת-לאחור. authorityOptions
// זהה לחלוטין למה ש-addMeal מזריק (currentUser/APP_VERSION), ללא authoritySource (קבוע בתוך
// המודול — logQuick המקורי תמיד השתמש ב-USER_CONFIRMED_AI_ESTIMATE, ללא פרמטריזציה).
async function logQuick(gi, btn) {
  const q = quickItems[gi]; if (!q) return;
  const committed = await QuickLogService.commitQuickItem(q, todayData, waterCount, {
    createdByUid: currentUser && currentUser.uid,
    systemVersion: APP_VERSION
  });
  if (!committed) return;
  if (userProfile) userProfile.quickItems = quickItems;
  if (btn) { const o = btn.innerHTML; btn.innerHTML = '✓ נוסף'; btn.disabled = true; setTimeout(()=>{ btn.innerHTML = o; btn.disabled = false; }, 1200); }
  await saveProfile(); // quickItems/streak — legacy broad-save, מחוץ ל-scope B4 (Review Q17)
  await updateStreak();
  renderFoodMeals();
  renderHome();
}

// C1-WP5E: חולץ ל-QuickLogService.togglePin — פסאדה תואמת-לאחור.
async function pinQuick(gi) {
  if (!QuickLogService.togglePin(quickItems, gi)) return;
  if (userProfile) userProfile.quickItems = quickItems;
  await saveProfile();
  renderQuickStrip();
}

// C1-WP5E: חולץ ל-QuickLogService.removeItem — פסאדה תואמת-לאחור.
async function removeQuick(gi) {
  QuickLogService.removeItem(quickItems, gi);
  if (userProfile) userProfile.quickItems = quickItems;
  await saveProfile();
  renderQuickStrip();
}

// שיחת למידה התחלתית — פעם אחת
function maybeShowQuickLearn() {
  const card = document.getElementById('quick-learn');
  if (!card || !userProfile) return;
  const show = !userProfile.quickOnboarded && quickItems.length === 0;
  card.classList.toggle('hidden', !show);
}

async function submitQuickLearn() {
  const a1 = qval('ql-morning'), a2 = qval('ql-breakfast'), a3 = qval('ql-snack');
  if (!a1 && !a2 && !a3) { dismissQuickLearn(); return; }
  document.getElementById('ql-loading').classList.remove('hidden');
  const _gen = SessionLifecycle.getGeneration(); // REM-002: session guard
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role: 'user', content:
      `הערך תזונתית עד 5 פריטים שהמשתמש צורך בקביעות. תשובות המשתמש — משקה בוקר: "${a1}"; ארוחת בוקר: "${a2}"; חטיף נפוץ: "${a3}". פצל לפריטים בודדים הגיוניים (למשל "קפה עם חלב" → פריט אחד). אם לא צוינה כמות הנח כמות טיפוסית. sodium במ"ג, השאר בגרם. החזר JSON בלבד: מערך של {"name":"שם בעברית","amount":0,"unit":"גרם","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}` }] });
    if (!SessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי הקריאה ל-AI
    const arr = parseModelJSON(data.content[0].text);
    const now = Date.now();
    // REM-001 §15/ER-002 — "quick-log onboarding AI generation": כל פריט מוערך עצמאית;
    // פריט שנדחה (REJECTED, ערכים לא הגיוניים) לא נכנס למאגר המהיר בכלל.
    const rawItems = Array.isArray(arr) ? arr.filter(it => it && it.name) : [];
    const gate = window.NutritionOutputValidator.validateNutritionMeal(rawItems, 'quick-log');
    logNutritionValidation(gate.overallStatus, 'quick-log', collectNutritionErrorCodes(gate));
    rawItems.forEach((it, idx) => {
      if (gate.itemResults[idx].status === 'REJECTED') return;
      quickItems.push({ name: String(it.name).trim(), amount: r1(it.amount), unit: it.unit||'', kcal: Math.round(+it.kcal||0),
        protein: r1(it.protein), carbs: r1(it.carbs), fat: r1(it.fat), fiber: r1(it.fiber), sugar: r1(it.sugar), sodium: Math.round(+it.sodium||0),
        count: 2, lastUsed: now, lastHour: null, pinned: false,
        // REM-003 §4 "Generative Persistent Data" — הצעת AI שאושרה ב-Level 2 (validator) בלבד;
        // אינה Authoritative עד שתירשם בפועל ביומן דרך logQuick() (שם מצורף authority עדכני משלה).
        authority: window.AuthorityContract.buildGenerativeMetadata({ systemVersion: APP_VERSION }) });
    });
    if (userProfile) { userProfile.quickItems = quickItems; userProfile.quickOnboarded = true; }
    await saveProfile();
    dismissQuickLearn();
    renderQuickStrip();
  } catch(e) { alert('שגיאה בבניית הרשימה. נסה שוב.'); }
  finally { document.getElementById('ql-loading').classList.add('hidden'); }
}

async function dismissQuickLearn() {
  if (userProfile) { userProfile.quickOnboarded = true; await saveProfile(); }
  const card = document.getElementById('quick-learn');
  if (card) card.classList.add('hidden');
}

function renderFoodMeals() {
  const list = document.getElementById('food-meals-list');
  if (!todayData.meals.length) { list.innerHTML = '<div class="empty-state">לא נרשמו ארוחות עדיין</div>'; return; }
  list.innerHTML = '<div class="meals-card">' + todayData.meals.map((m,i) => {
    const isFav = favoriteMeals.some(f => f.name === m.name);
    return `<div class="meal-row"><div><div class="meal-name">${m.name}</div><div class="meal-time">${m.time}</div></div><div style="display:flex;align-items:center;gap:4px"><div class="meal-kcal">${m.kcal} קל'</div><button onclick="toggleMealFavorite(${i}, this)" style="background:none;border:none;cursor:pointer;font-size:18px;padding:2px">${isFav ? '⭐' : '☆'}</button><button onclick="deleteMeal(${i})" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:18px;padding:2px">×</button></div></div>`;
  }).join('') + '</div>';
}

async function toggleMealFavorite(idx, btn) {
  const meal = todayData.meals[idx];
  if (!meal) return;
  const existsIdx = favoriteMeals.findIndex(f => f.name === meal.name);
  if (existsIdx >= 0) {
    favoriteMeals.splice(existsIdx, 1);
    btn.textContent = '☆';
  } else {
    favoriteMeals.push({ ...meal, savedAt: new Date().toISOString() });
    btn.textContent = '⭐';
  }
  await saveFavorites();
  renderFavoritesList();
}

async function deleteMeal(idx) {
  todayData.meals.splice(idx,1);
  await saveTodayData();
  renderFoodMeals(); renderHome();
}

// ── WORKOUT ──
function selectWorkout(type) {
  document.querySelectorAll('.workout-opt').forEach(o=>o.classList.remove('selected'));
  document.getElementById('wo-'+type).classList.add('selected');
  workoutType = type;
  document.getElementById('cardio-extra').classList.toggle('hidden', type!=='cardio');
  document.getElementById('save-workout-btn').disabled = false;
  updateWorkout();
}

function selectInt(level) {
  workoutInt = level;
  document.querySelectorAll('.int-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('int-'+level).classList.add('active');
  updateWorkout();
}

function updateCardio() {
  document.getElementById('speed-val').textContent = document.getElementById('speed-slider').value+' קמ"ש';
  document.getElementById('incline-val').textContent = document.getElementById('incline-slider').value+'%';
  updateWorkout();
}

function updateWorkout() {
  const dur = parseInt(document.getElementById('duration-slider').value);
  document.getElementById('duration-val').textContent = dur+' דק\'';
  if (!workoutType) { document.getElementById('burn-val').textContent = '--'; return; }
  const intMult = workoutInt==='easy'?0.75:workoutInt==='hard'?1.35:1.0;
  const weight = userProfile?userProfile.weight:75;
  let met = 5;
  if (workoutType==='cardio') {
    const speed = parseFloat(document.getElementById('speed-slider').value);
    const incline = parseInt(document.getElementById('incline-slider').value);
    met = speed<6?3.5:speed<10?7:speed<14?10:13;
    met += incline*0.5;
    met = Math.min(met, 16); // תקרה ריאלית — מונע "קלוריות דמיוניות" משיפוע גבוה
  } else if (workoutType==='strength') { met=5.5; }
  else if (workoutType==='calisthenics') { met=6; }
  document.getElementById('burn-val').textContent = Math.round(weight*met*intMult*(dur/60)).toLocaleString();
}

async function logSteps() {
  const val = parseInt(document.getElementById('steps-input').value);
  if (!val||val<0) { alert('מספר צעדים לא תקין'); return; }
  todayData.steps = val;
  document.getElementById('steps-input').value = '';
  await saveTodayData(); renderHome();
}

async function saveWorkout() {
  // B2 Code Review: השורה הישנה ב-Stage 5 wrapper הפעילה תמיד fireWorkoutTrigger(0)
  // גם כשלא נשמר דבר (workoutType ריק) — before/after delta יצא 0 כי todayData.burned
  // לא השתנה. נשמר כאן במפורש (parity) כדי לא לשנות behavior קיים ללא אישור Product.
  if (!workoutType) { await runEngineAction('SOURCE_DATA_CHANGED', 'triggerEngine', 'WORKOUT_COMPLETED', { burn: 0 }); return; }
  const burn = parseInt(document.getElementById('burn-val').textContent.replace(/,/g,''))||0;
  todayData.burned = (todayData.burned||0) + burn;
  userProfile.totalWorkouts = (userProfile.totalWorkouts||0) + 1;
  await saveTodayData();
  await saveProfile();
  await updateStreak();
  checkAchievements();
  sendLocalNotification('אימון נשמר! 💪', coachLine('workout', { burn: burn.toLocaleString() }));
  alert('האימון נשמר! שרפת '+burn.toLocaleString()+' קלוריות 💪');
  goToScreen('home');
  await runEngineAction('SOURCE_DATA_CHANGED', 'triggerEngine', 'WORKOUT_COMPLETED', { burn });
}

// ── STREAK ──
async function updateStreak() {
  if (!userProfile) return;
  const history = await getHistoryData();
  let streak = 0;
  const d = new Date();
  for (let i=0; i<365; i++) {
    const key = dateKey(d);
    const isToday = i===0;
    const dayData = isToday ? realTodayData : (history[key]||null);
    if (!dayData||!dayData.meals||!dayData.meals.length) break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  userProfile.streak = streak;
  await saveProfile();
  const el = document.getElementById('streak-num');
  if (el) el.textContent = streak;
}

// ── ACHIEVEMENTS ──
function checkAchievements() {
  if (!userProfile) return;
  const newOnes = ACHIEVEMENTS.filter(a => !userProfile['ach_'+a.id] && a.check(userProfile));
  newOnes.forEach(async a => {
    userProfile['ach_'+a.id] = true;
    await saveProfile();
    sendLocalNotification('הישג חדש! '+a.icon, coachLine('achieve', { title: a.title, icon: a.icon }));
  });
}

// ── GROUP ──
async function renderGroup() {
  if (!userProfile) return;
  const members = await getGroupMembers();
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  const allMembers = members.length > 0 ? members : [
    { name: userProfile.name, kcal: consumed, goal: userProfile.goalKcal, streak: userProfile.streak||0, isMe: true }
  ];
  allMembers.sort((a,b)=>b.streak-a.streak);
  const colors = ['#EEEDFE|#3C3489','#E1F5EE|#085041','#FAEEDA|#633806','#FAECE7|#712B13'];
  const lb = document.getElementById('leaderboard');
  lb.innerHTML = '<div class="meals-card">' + allMembers.map((m,i) => {
    const c = colors[i%colors.length].split('|');
    return `<div class="leaderboard-row"><div class="lb-rank">${i+1}</div><div class="lb-avatar" style="background:${c[0]};color:${c[1]}">${m.name.slice(0,1)}</div><div style="flex:1"><div class="lb-name">${m.name}${m.isMe?' (את/ה)':''}</div><div class="lb-sub">${m.kcal.toLocaleString()} / ${m.goal.toLocaleString()} קל'</div></div><div class="lb-streak">🔥 ${m.streak}</div></div>`;
  }).join('') + '</div>';
  const met = allMembers.filter(m=>m.kcal>=m.goal*0.85).length;
  const avg = Math.round(allMembers.reduce((s,m)=>s+m.streak,0)/allMembers.length);
  document.getElementById('gs-met').textContent = met+'/'+allMembers.length;
  document.getElementById('gs-streak').textContent = avg;

  // Show group code
  const codeEl = document.getElementById('my-group-code');
  if (codeEl && userProfile.groupId) codeEl.textContent = userProfile.groupId;
}

async function joinGroup() {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  if (!code || code.length < 4) { alert('הכנס קוד תקין'); return; }
  try {
    const exists = await GroupRepository.groupExists(code);
    if (!exists) {
      alert('קוד לא נמצא. בדוק שוב.'); return;
    }
    await GroupRepository.addMember(code, currentUser.uid);
    userProfile.groupId = code;
    await saveProfile();
    document.getElementById('join-code-input').value = '';
    alert('הצטרפת לקבוצה! 🎉');
    renderGroup();
  } catch(e) { alert('שגיאה בהצטרפות.'); }
}

async function getWeeklySummary() {
  document.getElementById('weekly-summary-loading').classList.remove('hidden');
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: `כתוב סיכום שבועי מעודד ואישי בעברית עבור ${userProfile.name} (מטרה: ${GOAL_LABELS[userProfile.goal]}, יעד: ${userProfile.goalKcal} קל', היום: ${consumed} קל', סטריק: ${userProfile.streak||0} ימים, אימונים סה"כ: ${userProfile.totalWorkouts||0}). 2-3 משפטים עם מילות עידוד ועצה פרקטית.` }] });
    document.getElementById('weekly-summary').textContent = data.content[0].text;
  } catch(e) { document.getElementById('weekly-summary').textContent = 'שגיאה. נסה שוב.'; }
  finally { document.getElementById('weekly-summary-loading').classList.add('hidden'); }
}

function shareApp() {
  const url = 'https://randahari.github.io/fitme';
  const text = 'הצטרף אלי ל-FitMe! קוד הקבוצה שלי: ' + (userProfile?.groupId || '');
  if (navigator.share) { navigator.share({ title: 'FitMe', text, url }); }
  else { navigator.clipboard.writeText(url+'\n'+text).then(()=>alert('הלינק הועתק!')); }
}

// ── PLAN ──
function renderPlanBanner() {
  const el = document.getElementById('goal-banner');
  if (!el||!userProfile) return;
  const styles = { cut:'background:var(--coral-light);color:var(--coral-text)', bulk:'background:var(--teal-light);color:var(--teal-text)', maintain:'background:var(--amber-light);color:var(--amber-text)' };
  el.setAttribute('style', styles[userProfile.goal]||'');
  el.textContent = 'המטרה שלך: '+(GOAL_LABELS[userProfile.goal]||'');
}

function renderPlan() {
  renderPlanBanner();
  if (!userProfile) return;
  const p = Math.round(userProfile.weight*(userProfile.goal==='bulk'?2:userProfile.goal==='cut'?2.2:1.8));
  const f = Math.round(userProfile.goalKcal*0.25/9);
  const c = Math.round((userProfile.goalKcal-p*4-f*9)/4);
  document.getElementById('plan-targets').innerHTML = `
    <div class="plan-target"><div class="pt-label">קלוריות</div><div class="pt-val">${userProfile.goalKcal.toLocaleString()}</div></div>
    <div class="plan-target"><div class="pt-label">חלבון</div><div class="pt-val">${p}g</div></div>
    <div class="plan-target"><div class="pt-label">פחמימות</div><div class="pt-val">${c}g</div></div>
    <div class="plan-target"><div class="pt-label">שומן</div><div class="pt-val">${f}g</div></div>`;
  if (userProfile.weeklyMenu) renderWeeklyMenu(userProfile.weeklyMenu);
}

async function generatePlan() {
  document.getElementById('plan-loading').classList.remove('hidden');
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: `תפריט שבועי: מטרה=${GOAL_LABELS[userProfile.goal]}, קלוריות=${userProfile.goalKcal}, מאכלים=${userProfile.foods.join(',')}. JSON בלבד: מערך 7: {day:"יום א'",breakfast:"",lunch:"",dinner:"",snack:""}` }] });
    const menu = parseModelJSON(data.content[0].text);
    userProfile.weeklyMenu = menu;
    // REM-003 §4 "Generative Persistent Data" — התפריט הוא הצעה בלבד (כמו הדוגמה "Weekly Menu"
    // בסעיף עצמו): מותר לשמור, אך מסומן במפורש כלא-סמכותי ולא נקרא ע"י אף מנוע דטרמיניסטי.
    // שדה-אח נפרד, לא נוגע בצורת המערך שממנה renderWeeklyMenu קורא.
    userProfile.weeklyMenuMeta = window.AuthorityContract.buildGenerativeMetadata({ systemVersion: APP_VERSION });
    await saveProfile();
    renderWeeklyMenu(menu);
  } catch(e) { alert('שגיאה.'); }
  finally { document.getElementById('plan-loading').classList.add('hidden'); }
}

function renderWeeklyMenu(menu) {
  document.getElementById('weekly-menu').innerHTML = menu.map(d=>
    `<div class="menu-day"><div class="menu-day-title">${d.day}</div><div class="menu-meal"><span class="menu-meal-label">בוקר: </span>${d.breakfast}</div><div class="menu-meal"><span class="menu-meal-label">צהריים: </span>${d.lunch}</div><div class="menu-meal"><span class="menu-meal-label">ערב: </span>${d.dinner}</div><div class="menu-meal"><span class="menu-meal-label">חטיף: </span>${d.snack}</div></div>`
  ).join('');
}

// תוכנית אימונים הוסרה לבקשת המשתמש — תוכנית תזונה בלבד

// ── PROFILE ──
// C1-WP1: מחולצים ל-js/domain/profileMetrics.js — פסאדות תואמות-לאחור, ללא שינוי התנהגות.
function calcBMI(weight, height) { return ProfileMetrics.calcBMI(weight, height); }
function getBMICategory(bmi) { return ProfileMetrics.getBMICategory(bmi); }
function calcBodyFat(weight, height, age, gender) { return ProfileMetrics.calcBodyFat(weight, height, age, gender); }

function getAvatarSVG(bmi, gender) {
  const isMale = gender !== 'female';
  let bodyWidth = bmi < 18.5 ? 28 : bmi < 25 ? 36 : bmi < 30 ? 44 : 52;
  let color = bmi < 18.5 ? '#AFA9EC' : bmi < 25 ? '#534AB7' : bmi < 30 ? '#BA7517' : '#E24B4A';
  return `<svg viewBox="0 0 80 120" width="80" height="120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="20" r="14" fill="${color}" opacity="0.9"/>
    <rect x="${40 - bodyWidth/2}" y="36" width="${bodyWidth}" height="48" rx="${bodyWidth/4}" fill="${color}" opacity="0.8"/>
    <rect x="${40 - bodyWidth/2 - 8}" y="38" width="10" height="36" rx="5" fill="${color}" opacity="0.7"/>
    <rect x="${40 + bodyWidth/2 - 2}" y="38" width="10" height="36" rx="5" fill="${color}" opacity="0.7"/>
    <rect x="${40 - bodyWidth/4 - 4}" y="84" width="12" height="32" rx="6" fill="${color}" opacity="0.7"/>
    <rect x="${40 + bodyWidth/4 - 8}" y="84" width="12" height="32" rx="6" fill="${color}" opacity="0.7"/>
  </svg>`;
}

async function renderProfile() {
  if (!userProfile) return;
  const history = await getHistoryData();

  const weight = userProfile.currentWeight || userProfile.weight;
  const height = userProfile.height;
  const age = userProfile.age;
  const gender = userProfile.gender;

  const bmi = calcBMI(weight, height);
  const bmiCat = getBMICategory(bmi);
  const bodyFat = calcBodyFat(weight, height, age, gender);
  const bmr = gender === 'male'
    ? Math.round(88.36 + (13.4*weight) + (4.8*height) - (5.7*age))
    : Math.round(447.6 + (9.2*weight) + (3.1*height) - (4.3*age));
  const tdee = userProfile.goalKcal;
  const idealWeight = gender === 'male' ? Math.round(22.5 * (height/100) * (height/100)) : Math.round(21 * (height/100) * (height/100));
  const toGoal = Math.round((weight - idealWeight) * 10) / 10;
  const totalKcalBurned = Object.values(history).reduce((s,d)=>s+(d.burned||0),0) + (todayData.burned||0);

  // Avatar
  const avatarEl = document.getElementById('prof-avatar-svg');
  if (avatarEl) avatarEl.innerHTML = getAvatarSVG(bmi, gender);

  document.getElementById('prof-name').textContent = userProfile.name;
  document.getElementById('prof-goal').textContent = GOAL_LABELS[userProfile.goal] || '';

  // Health data
  const healthEl = document.getElementById('health-data');
  if (healthEl) {
    const progressPct = idealWeight > 0 ? Math.min(100, Math.max(0, 100 - Math.abs(toGoal/idealWeight*100))) : 100;
    healthEl.innerHTML = `
      <div class="health-row"><span class="health-label">משקל נוכחי</span><span class="health-val">${weight} ק"ג</span></div>
      <div class="health-row"><span class="health-label">BMI</span><span class="health-val" style="color:${bmiCat.color}">${bmi} — ${bmiCat.label}</span></div>
      <div class="health-row"><span class="health-label">% שומן משוער</span><span class="health-val">${bodyFat}%</span></div>
      <div class="health-row"><span class="health-label">BMR (מנוחה)</span><span class="health-val">${bmr.toLocaleString()} קל'</span></div>
      <div class="health-row"><span class="health-label">TDEE (יומי)</span><span class="health-val">${tdee.toLocaleString()} קל'</span></div>
      <div class="health-row"><span class="health-label">משקל אידיאלי</span><span class="health-val">${idealWeight} ק"ג</span></div>
      <div class="health-row"><span class="health-label">${toGoal > 0 ? 'עודף' : 'חסר'} ממשקל אידיאלי</span><span class="health-val">${Math.abs(toGoal)} ק"ג</span></div>
      <div style="margin-top:8px">
        <div style="font-size:11px;color:var(--text-3);margin-bottom:4px">התקדמות למשקל יעד</div>
        <div style="height:6px;background:var(--bg-3);border-radius:3px"><div style="height:6px;background:#1D9E75;border-radius:3px;width:${progressPct}%"></div></div>
      </div>`;
  }

  // Stats
  document.getElementById('stat-burned').textContent = totalKcalBurned.toLocaleString();
  document.getElementById('stat-workouts').textContent = userProfile.totalWorkouts || 0;
  document.getElementById('stat-streak-best').textContent = Math.max(userProfile.streak||0, userProfile.bestStreak||0);
  document.getElementById('stat-streak-cur').textContent = userProfile.streak || 0;

  renderAchievements();
}

function renderWeightChart(history) {
  const el = document.getElementById('weight-chart');
  if (!el) return;
  const weights = userProfile.weightHistory || [];
  if (weights.length < 2) { el.innerHTML = '<div class="empty-state">הוסף לפחות 2 מדידות משקל לראות גרף</div>'; return; }
  const vals = weights.slice(-14);
  const min = Math.min(...vals.map(v=>v.weight)) - 1;
  const max = Math.max(...vals.map(v=>v.weight)) + 1;
  const w = 300, h = 80;
  const points = vals.map((v,i) => {
    const x = (i/(vals.length-1))*w;
    const y = h - ((v.weight-min)/(max-min))*h;
    return `${x},${y}`;
  }).join(' ');
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:80px"><polyline points="${points}" fill="none" stroke="#534AB7" stroke-width="2" stroke-linejoin="round"/>${vals.map((v,i)=>{const x=(i/(vals.length-1))*w;const y=h-((v.weight-min)/(max-min))*h;return `<circle cx="${x}" cy="${y}" r="3" fill="#534AB7"/>`;}).join('')}</svg>`;
}

function renderAchievements() {
  const el = document.getElementById('achievements-list');
  if (!el||!userProfile) return;
  el.innerHTML = ACHIEVEMENTS.map(a => {
    const earned = userProfile['ach_'+a.id];
    return `<div class="achievement ${earned?'earned':'locked'}"><div class="ach-icon">${earned?a.icon:'🔒'}</div><div class="ach-title">${a.title}</div></div>`;
  }).join('');
}

async function getWeeklyLetter() {
  document.getElementById('weekly-letter').textContent = 'Claude כותב...';
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user', content: `כתוב מכתב אישי קצר ומעודד בעברית ל${userProfile.name} לסיום השבוע. נתונים: מטרה=${GOAL_LABELS[userProfile.goal]}, סטריק=${userProfile.streak||0} ימים, אימונים=${userProfile.totalWorkouts||0}, היום=${consumed} קל'. כתוב בגוף ראשון אישי, 3-4 משפטים, עם עידוד אמיתי ועצה לשבוע הבא.` }] });
    document.getElementById('weekly-letter').textContent = data.content[0].text;
  } catch(e) { document.getElementById('weekly-letter').textContent = 'שגיאה. נסה שוב.'; }
}

// ── SETTINGS ──
function renderSettings() {
  if (!userProfile) return;
  const el = document.getElementById('profile-avatar');
  if (el) el.textContent = (userProfile.name||'?').slice(0,2);
  const pn = document.getElementById('profile-name');
  if (pn) pn.textContent = userProfile.name;
  const ps = document.getElementById('profile-sub');
  if (ps) ps.textContent = `${userProfile.weight} ק"ג · ${userProfile.height} ס"מ · גיל ${userProfile.age} · ${GOAL_LABELS[userProfile.goal]||''}`;
  const sk = document.getElementById('s-kcal');
  if (sk) sk.textContent = (userProfile.goalKcal||0).toLocaleString()+' קל\'';
  const favEl = document.getElementById('fav-foods-display');
  if (favEl&&userProfile.foods) favEl.innerHTML = userProfile.foods.map(f=>`<span class="fav-tag">${f}</span>`).join('');
  if (darkMode) { const dt = document.getElementById('dark-toggle'); if (dt) dt.classList.add('on'); }
  const gc = document.getElementById('settings-group-code');
  if (gc) gc.textContent = userProfile.groupId || '--';
  renderCoachSettings();
}

// ── COACH SETTINGS — C1-WP6: חולץ ל-CoachPresenter — פסאדות תואמות-לאחור.
function renderCoachSettings() { return CoachPresenter.renderCoachSettings(); }
async function saveCoachSettings() { return CoachPresenter.saveCoachSettings(); }
async function setCoachStyle(v) { return CoachPresenter.setCoachStyle(v); }
async function setCoachChatter(v) { return CoachPresenter.setCoachChatter(v); }
async function testCoachMessage() { return CoachPresenter.testCoachMessage(); }

// saveApiKey — הוסר: המפתח יושב עכשיו בענן, המשתמשים לא צריכים להזין כלום

async function toggleDark() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  document.getElementById('dark-toggle-btn').textContent = darkMode?'☀️':'🌙';
  document.querySelectorAll('#dark-toggle').forEach(t=>t.classList.toggle('on',darkMode));
  if (userProfile) { userProfile.darkMode = darkMode; await saveProfile(); }
}

async function resetApp() {
  if (confirm('למחוק את כל הנתונים שלך?')) {
    try { await db.collection('users').doc(currentUser.uid).delete(); } catch(e) {}
    userProfile = null; todayData = { meals:[], burned:0, steps:0 }; waterCount = 0;
    showOnboarding();
  }
}

// ── FOOD TABS ──
function switchFoodTab(tab) {
  document.querySelectorAll('.food-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('ftab-' + tab).classList.add('active');
  document.getElementById('food-tab-today').classList.toggle('hidden', tab !== 'today');
  document.getElementById('food-tab-favorites').classList.toggle('hidden', tab !== 'favorites');
}

// ── OVERRIDE: goToScreen (4-tab version) ──
goToScreen = function(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const screen = document.getElementById('screen-'+name);
  if (screen) screen.classList.add('active');
  const nav = document.getElementById('nav-'+name);
  if (nav) nav.classList.add('active');
  if (name==='home') renderHome();
  if (name==='food') { renderFoodMeals(); renderFavoritesList(); renderQuickStrip(); maybeShowQuickLearn(); }
  if (name==='profile') renderProfile();
  if (name==='settings') renderSettings();
  if (name==='workout') updateWorkout();
};

// ── OVERRIDE: renderHome with ring ──
renderHome = function() {
  if (!userProfile) return;
  document.getElementById('greeting').textContent = 'שלום, ' + userProfile.name;
  setTodayDate();
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  const target = userProfile.goalKcal || 2000;
  const pct = Math.min(100, Math.round(consumed/target*100));

  // Ring arc — circumference of r=46 is ~289
  const circ = 2 * Math.PI * 46;
  const fill = (pct / 100) * circ;
  const arc = document.getElementById('ring-arc');
  if (arc) arc.style.strokeDasharray = fill + ' ' + circ;

  const pctEl = document.getElementById('ring-pct');
  if (pctEl) pctEl.textContent = pct + '%';
  document.getElementById('kcal-consumed').textContent = consumed.toLocaleString();
  document.getElementById('kcal-target').textContent = target.toLocaleString();
  document.getElementById('kcal-remain').textContent = 'נותרו ' + Math.max(0,target-consumed).toLocaleString() + ' קל׳';

  const protein = todayData.meals.reduce((s,m)=>s+(m.protein||0),0);
  const carbs = todayData.meals.reduce((s,m)=>s+(m.carbs||0),0);
  const fat = todayData.meals.reduce((s,m)=>s+(m.fat||0),0);
  document.getElementById('m-protein').textContent = Math.round(protein)+'g';
  document.getElementById('m-carbs').textContent = Math.round(carbs)+'g';
  document.getElementById('m-fat').textContent = Math.round(fat)+'g';

  const tP = Math.round((userProfile.weight||75)*1.8);
  const tC = Math.round((target - tP*4 - Math.round(target*0.25/9)*9)/4);
  const tF = Math.round(target*0.25/9);
  const bp = document.getElementById('bar-protein');
  const bc = document.getElementById('bar-carbs');
  const bf = document.getElementById('bar-fat');
  if (bp) bp.style.width = Math.min(100,Math.round(protein/tP*100))+'%';
  if (bc) bc.style.width = Math.min(100,Math.round(carbs/Math.max(tC,1)*100))+'%';
  if (bf) bf.style.width = Math.min(100,Math.round(fat/Math.max(tF,1)*100))+'%';

  document.getElementById('burned-val').textContent = (todayData.burned||0).toLocaleString();
  document.getElementById('steps-val').textContent = (todayData.steps||0).toLocaleString();
  document.getElementById('weight-val').textContent = userProfile.currentWeight || userProfile.weight || '--';
  document.getElementById('streak-num').textContent = userProfile.streak || 0;

  renderMealsInHome();
  buildWater();
  buildWeekChart();
  refreshCoachCard();
};

// ── Settings: plan section ──
function generatePlanFromSettings() {
  generatePlan().then(() => {
    if (userProfile && userProfile.weeklyMenu) {
      const el = document.getElementById('weekly-menu-settings');
      if (el) el.innerHTML = userProfile.weeklyMenu.map(d =>
        `<div class="menu-day"><div class="menu-day-title">${d.day}</div><div class="menu-meal"><span class="menu-meal-label">בוקר: </span>${d.breakfast}</div><div class="menu-meal"><span class="menu-meal-label">צהריים: </span>${d.lunch}</div><div class="menu-meal"><span class="menu-meal-label">ערב: </span>${d.dinner}</div><div class="menu-meal"><span class="menu-meal-label">חטיף: </span>${d.snack}</div></div>`
      ).join('');
    }
  });
}

// Plan targets in settings
const _origRenderSettings = renderSettings;
renderSettings = function() {
  _origRenderSettings();
  if (!userProfile) return;
  const p = Math.round(userProfile.weight*(userProfile.goal==='bulk'?2:userProfile.goal==='cut'?2.2:1.8));
  const f = Math.round(userProfile.goalKcal*0.25/9);
  const c = Math.round((userProfile.goalKcal-p*4-f*9)/4);
  const el = document.getElementById('plan-targets-settings');
  if (el) el.innerHTML = `<div class="stats-row"><div class="stat-item"><div class="stat-v">${userProfile.goalKcal}</div><div class="stat-l">קל׳</div></div><div class="stat-item"><div class="stat-v">${p}g</div><div class="stat-l">חלבון</div></div><div class="stat-item"><div class="stat-v">${c}g</div><div class="stat-l">פחמ׳</div></div><div class="stat-item"><div class="stat-v">${f}g</div><div class="stat-l">שומן</div></div></div>`;
  if (userProfile.weeklyMenu) {
    const wm = document.getElementById('weekly-menu-settings');
    if (wm) wm.innerHTML = userProfile.weeklyMenu.map(d =>
      `<div class="menu-day"><div class="menu-day-title">${d.day}</div><div class="menu-meal"><span class="menu-meal-label">בוקר: </span>${d.breakfast}</div><div class="menu-meal"><span class="menu-meal-label">צהריים: </span>${d.lunch}</div><div class="menu-meal"><span class="menu-meal-label">ערב: </span>${d.dinner}</div><div class="menu-meal"><span class="menu-meal-label">חטיף: </span>${d.snack}</div></div>`
    ).join('');
  }

  // ── תווית גרסה (לאבחון) ──
  const settingsScreen = document.getElementById('screen-settings');
  if (settingsScreen && !document.getElementById('fitme-version-tag')) {
    const scroll = settingsScreen.querySelector('.scroll-content');
    if (scroll) {
      const tag = document.createElement('div');
      tag.id = 'fitme-version-tag';
      tag.style.cssText = 'text-align:center;padding:16px 0 8px;color:var(--text-3);font-size:11px;letter-spacing:2px;opacity:0.7';
      tag.textContent = 'FitMe · v' + APP_VERSION;
      scroll.appendChild(tag);
    }
  } else if (document.getElementById('fitme-version-tag')) {
    document.getElementById('fitme-version-tag').textContent = 'FitMe · v' + APP_VERSION;
  }
};


// ══════════════════════════════════════════════════════════════════
// ── STAGE 4: יעד קלוריות מסתגל (Adaptive TDEE) ──
// מנוע מנותק מה-UI ככל האפשר: פונקציות חישוב טהורות למעלה,
// שכבת תצוגה דקה (hooks) למטה. עוצב פונקציונלית בלבד — יעוצב מחדש בהמשך.
// ══════════════════════════════════════════════════════════════════

// C1-WP1: daysBetween/linearSlope/dayKcal — פסאדות תואמות-לאחור קבועות (חלק מה"closed
// compatibility surface" שנקבע ב-WP1, כמו dateKey/getTodayKey/esc) — נשארות כאן ללא שינוי
// גם אחרי שהקוד היחיד שהשתמש בהן (STAGE 4) חולץ; ראה tests/c1Wp1Wiring.test.js.
function daysBetween(k1, k2) { return DateUtils.daysBetween(k1, k2); }
function linearSlope(points) { return NumberUtils.linearSlope(points); }
function dayKcal(dayData) { return NutritionModel.dayKcal(dayData); }

// ── C1-WP7: פונקציות החישוב הטהורות (ADAPT_RATES ושאר הקבועים, בחירת קצב, בניית חלון
// ימים, סיווג יום, זיהוי ימי-רישום-חלקי, חישוב TDEE, ניתוח היקפים, אותות שבועיים,
// התאמת גירעון, בניית הצעה, הסבר מקומי) חולצו ל-js/adaptive/adaptiveTdeeDomain.js —
// פסאדות תואמות-לאחור בלבד.
function adaptRate() { return AdaptiveTdeeDomain.adaptRate(userProfile); }
function adaptEnabled() { return AdaptiveTdeeDomain.adaptEnabled(userProfile); }
function daysInWindow(history, windowDays) { return AdaptiveTdeeDomain.daysInWindow(history, todayData, windowDays); }
function classifyDay(day, goalKcal, confirmedLight) { return AdaptiveTdeeDomain.classifyDay(day, goalKcal, confirmedLight); }
function pendingPartialDays() { return AdaptiveTdeeDomain.pendingPartialDays(window._adaptHistoryCache, todayData, userProfile); }
function computeAdaptiveTdee(history, profile) { return AdaptiveTdeeDomain.computeAdaptiveTdee(history, profile, todayData); }
function analyzeMeasurements(profile) { return AdaptiveTdeeDomain.analyzeMeasurements(profile); }
function buildWeeklySignals(calc, meas, profile) { return AdaptiveTdeeDomain.buildWeeklySignals(calc, meas, profile); }
function computeNextDeficit(signals, profile) { return AdaptiveTdeeDomain.computeNextDeficit(signals, profile); }
function buildAdaptiveProposal(history, profile) { return AdaptiveTdeeDomain.buildAdaptiveProposal(history, profile, todayData); }
function adaptiveLocalExplain(prop) { return AdaptiveTdeeDomain.adaptiveLocalExplain(prop); }

// ══════════════════════════════════════════════════════════════════
// ── שכבת UI (דקה) — hooks על פונקציות קיימות ──
// ══════════════════════════════════════════════════════════════════

let _adaptProposal = null; // ההצעה הממתינה לאישור

// ── C1-WP7: "Application/UI Responsibilities" חולצו ל-js/adaptive/adaptiveTdeeController.js
// — פסאדות תואמות-לאחור בלבד. session checks/State Access/PersistenceGateway path ללא
// שינוי (רק מיקום הקוד). _adaptProposal נשאר משתנה משותף כאן (ה-setter שלו עדיין מוזרק
// ל-StateAccess דרך setAdaptProposal, ללא שינוי).
async function runAdaptiveCheck(access) { return AdaptiveTdeeController.runAdaptiveCheck(access); }
async function renderAdaptiveCard() { return AdaptiveTdeeController.renderAdaptiveCard(); }
async function coachAdaptiveMessage(p) { return AdaptiveTdeeController.coachAdaptiveMessage(p); }
async function applyAdaptiveUpdate() { return AdaptiveTdeeController.applyAdaptiveUpdate(); }
async function dismissAdaptiveUpdate() { return AdaptiveTdeeController.dismissAdaptiveUpdate(); }
function renderPartialPrompt() { return AdaptiveTdeeController.renderPartialPrompt(); }
async function confirmDayLight(key) { return AdaptiveTdeeController.confirmDayLight(key); }
async function logMeasurements() { return AdaptiveTdeeController.logMeasurements(); }
function renderMeasurements() { return AdaptiveTdeeController.renderMeasurements(); }
function renderAdaptiveSettings() { return AdaptiveTdeeController.renderAdaptiveSettings(); }
async function setAdaptiveRate(v) { return AdaptiveTdeeController.setAdaptiveRate(v); }
async function toggleAdaptive() { return AdaptiveTdeeController.toggleAdaptive(); }

// B2: Adaptive TDEE Engine orchestration no longer wraps showApp/logWeight here —
// see runAppReadyEngines() (showApp) and runEngineAction() (logWeight),
// wired through the Engine Registry near the end of this file.

const _s4_renderProfile = renderProfile;
renderProfile = async function() {
  await _s4_renderProfile();
  renderMeasurements();
};

const _s4_renderSettings = renderSettings;
renderSettings = function() {
  _s4_renderSettings();
  renderAdaptiveSettings();
};


// ══════════════════════════════════════════════════════════════════
// ── STAGE 5 (v2.10.0): מנוע טריגרים + תשתית זיכרון + מונה שימוש ──
// המאמן מגיב לאירועים אמיתיים, לא לשעון. מנותק מ-UI ככל האפשר.
// עוצב פונקציונלית בלבד — יעוצב מחדש בשלב העיצוב.
// ══════════════════════════════════════════════════════════════════

// C1-WP8: COACH_DAILY_BUDGET/PRIO חולצו ל-js/trigger/triggerDomain.js (משמשים רק את
// אלגוריתם בדיקת התקציב/מעריכי הטריגרים, שם). COACH_EVENTS_CAP נשאר כאן — עדיין בשימוש
// ישיר בתוך StateAccess.configure() (recordCoachEvent, B3 קפוא) למטה בקובץ.
const COACH_EVENTS_CAP = 200;   // גודל יומן האירועים

// ── תשתית זיכרון: מבטיח שהמבנה קיים (נזרע ריק, ימולא בשלב הבא) ──
function ensureCoachMemory() {
  if (!userProfile) return;
  if (!userProfile.coachMemory) {
    userProfile.coachMemory = { observations: [], preferences: {}, lastUpdated: null };
  }
  if (!Array.isArray(userProfile.coachEvents)) userProfile.coachEvents = [];
}

// ── ניסוח קצר של הזיכרון לתוך הוראת המערכת — C1-WP6: חולץ ל-CoachPromptComposer.
function coachMemoryPromptFragment() { return CoachPromptComposer.coachMemoryFragment(userProfile); }

// ── תקציב הטון: מעקב יומי (מתאפס בכל יום) ──
function coachDay() {
  ensureCoachMemory();
  const today = getTodayKey();
  if (!userProfile.coachDay || userProfile.coachDay.date !== today) {
    userProfile.coachDay = { date: today, fired: [], count: 0 };
  }
  return userProfile.coachDay;
}
// C1-WP8: אלגוריתם ההשוואה הטהור חולץ ל-TriggerDomain.canFire — coachDay() (סטטפולי,
// שזור ב-StateAccess.configure() הקפוא של B3) נשאר כאן ללא שינוי.
function canFire(type, priority) { return TriggerDomain.canFire(coachDay(), type, priority); }

// ══ הערכת טריגרים — פונקציות תנאי טהורות ══
// כל אחת מחזירה אובייקט טריגר {type, priority, live, kind, data} או null.

function todayConsumed() { return todayData.meals.reduce((s, m) => s + (m.kcal || 0), 0); }
function todayProtein() { return Math.round(todayData.meals.reduce((s, m) => s + (m.protein || 0), 0)); }
// C1-WP1: מחולץ ל-js/domain/profileMetrics.js — פסאדה תואמת-לאחור, ללא שינוי התנהגות.
function computeProteinTarget(weight) { return ProfileMetrics.computeProteinTarget(weight); }
function proteinTarget() { return computeProteinTarget(userProfile.weight); }

// ── C1-WP8: מעריכי הטריגרים, בחירת הטריגר, רמז המאכל החלבוני, וטקסט הטריגר המקומי
// חולצו ל-js/trigger/triggerDomain.js — פסאדות תואמות-לאחור בלבד. runCoachTriggers/
// presentTriggerCard/triggerLiveText/fireWorkoutTrigger/presentWorkoutTriggerCard
// (Application Responsibilities) חולצו ל-js/trigger/triggerController.js.
function proteinFoodHint() { return TriggerDomain.proteinFoodHint(userProfile); }
function evalRedFlag(history, profile) { return TriggerDomain.evalRedFlag(history, profile, todayData); }
function evalForgotToEat(todayNutrition) { return TriggerDomain.evalForgotToEat(todayNutrition); }
function evalLowProtein(history, triggerProfile, todayNutrition) { return TriggerDomain.evalLowProtein(history, triggerProfile, todayNutrition); }
function evalNoWorkout(history, triggerProfile, todayNutrition) { return TriggerDomain.evalNoWorkout(history, triggerProfile, todayNutrition); }
function evalCloseToGoal(triggerProfile, todayNutrition) { return TriggerDomain.evalCloseToGoal(triggerProfile, todayNutrition); }
function evalStreakMilestone(triggerProfile) { return TriggerDomain.evalStreakMilestone(triggerProfile); }
function triggerLocalText(t) { return TriggerDomain.triggerLocalText(userProfile, t); }
async function triggerLiveText(t) { return TriggerController.triggerLiveText(t); }
async function runCoachTriggers(access) { return TriggerController.runCoachTriggers(access); }
async function presentTriggerCard(t, sessionGeneration) { return TriggerController.presentTriggerCard(t, sessionGeneration); }
async function fireWorkoutTrigger(burn, access) { return TriggerController.fireWorkoutTrigger(burn, access); }
async function presentWorkoutTriggerCard(burn, goal, sessionGeneration) { return TriggerController.presentWorkoutTriggerCard(burn, goal, sessionGeneration); }

// ══════════════════════════════════════════════════════════════════
// ── מונה שימוש (שקיפות עלויות) ──
// דליים: 'photo' (תמונות — היקר), 'coach' (הודעות מאמן), 'text' (שאלון/תפריט/מכתב)
// ══════════════════════════════════════════════════════════════════
const USAGE_LABELS = { photo: 'תמונות (צלחת/תווית)', coach: 'הודעות מאמן', text: 'טקסט (שאלון/תפריט)' };

function usageMonthKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function ensureUsage() {
  if (!userProfile) return;
  const mk = usageMonthKey();
  if (!userProfile.usage || userProfile.usage.month !== mk) {
    userProfile.usage = { month: mk, byType: { photo: 0, coach: 0, text: 0 } };
  }
}
function classifyCall(body) {
  try {
    const msgs = body.messages || [];
    for (const m of msgs) {
      if (Array.isArray(m.content) && m.content.some(c => c && c.type === 'image')) return 'photo';
    }
  } catch (e) {}
  if (body && body.system) return 'coach'; // הודעות מאמן נושאות system prompt
  return 'text';
}
async function trackUsage(body) {
  if (!userProfile) return;
  ensureUsage();
  const t = classifyCall(body);
  userProfile.usage.byType[t] = (userProfile.usage.byType[t] || 0) + 1;
  // שמירה עדינה — לא חוסמת את הקריאה עצמה
  saveProfile();
}

function renderUsage() {
  const el = document.getElementById('usage-info');
  if (!el || !userProfile) return;
  ensureUsage();
  const u = userProfile.usage.byType;
  const total = (u.photo || 0) + (u.coach || 0) + (u.text || 0);
  el.innerHTML =
    `<div class="settings-row"><span>סה"כ קריאות החודש</span><span class="settings-val">${total}</span></div>` +
    Object.keys(USAGE_LABELS).map(k =>
      `<div class="settings-row"><span>${USAGE_LABELS[k]}</span><span class="settings-val">${u[k] || 0}</span></div>`
    ).join('') +
    `<div style="font-size:11px;color:var(--text-3);padding:8px 0 0;line-height:1.5">💡 התמונות הן העלות המשמעותית. טקסט והודעות מאמן זולים מאוד.</div>`;
}

// ══════════════════════════════════════════════════════════════════
// ── Hooks: עטיפת פונקציות קיימות (override על הסופיות) ──
// ══════════════════════════════════════════════════════════════════

// callClaude → מונה שימוש (מנסה לספור, לעולם לא חוסם)
const _s5_callClaude = callClaude;
callClaude = async function(body) {
  try { trackUsage(body); } catch (e) {}
  return await _s5_callClaude(body);
};

// C1-WP6: buildCoachSystemPrompt's two historical layers here (the synchronous base
// definition, and this async override that injected coachMemory + B5 Derived Intelligence)
// were consolidated into CoachPromptComposer.buildSystemPrompt() — one function, same
// behavior, no more override chain (see the coachMessage()/buildCoachSystemPrompt()
// facades near the COACH ENGINE section). See tests/coachPromptComposer.test.js and
// tests/c1Wp6Wiring.test.js for direct behavioral comparison against this removed code.

// B2: Trigger Engine orchestration no longer wraps showApp/saveWorkout here —
// see runAppReadyEngines() (showApp, action DAILY_COACH_CHECK) and the
// runEngineAction() call inside saveWorkout() itself (action
// WORKOUT_COMPLETED), wired through the Engine Registry near the end of this file.

// renderSettings → מציג את מונה השימוש
const _s5_renderSettings_u = renderSettings;
renderSettings = function() {
  _s5_renderSettings_u();
  renderUsage();
};

// scheduleLocalNotifications — C1-WP8: חולץ ל-TriggerController — פסאדה תואמת-לאחור.
// נקראת דרך Trigger Engine adapter (AUTH_SESSION_READY / LOCAL_NOTIFICATION_SCHEDULE) —
// ראה סוף הקובץ.
function scheduleLocalNotifications(access) { return TriggerController.scheduleLocalNotifications(access); }

// ══════════════════════════════════════════════════════════════════
// שלב 2 — ניווט תאריך + עריכת ארוחות עבר + רישום ליום קודם
// מודול עצמאי: עוטף פונקציות קיימות בלי לשכתב אותן.
// ══════════════════════════════════════════════════════════════════
(function () {
  const MAX_PAST_DAYS = 7; // עד כמה אחורה מותר לצפות ולערוך

  function keyToDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function viewingToday() { return currentDayKey === getTodayKey(); }
  function daysBack(key) {
    const ms = keyToDate(getTodayKey()) - keyToDate(key);
    return Math.round(ms / 86400000);
  }
  function formatDayLabel(key) {
    const back = daysBack(key);
    if (back === 0) return 'היום';
    if (back === 1) return 'אתמול';
    const d = keyToDate(key);
    const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    return 'יום ' + days[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1);
  }

  // ── סרגל ניווט התאריך (מוזרק פעם אחת לראש מסך הבית) ──
  function ensureDateNav() {
    if (document.getElementById('date-nav')) return;
    const sc = document.querySelector('#screen-home .scroll-content');
    if (!sc) return;
    const bar = document.createElement('div');
    bar.id = 'date-nav';
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--bg-2,#fff);border-radius:14px;padding:8px 10px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.06)';
    bar.innerHTML =
      '<button id="date-prev" onclick="dayNavPrev()" aria-label="יום קודם" style="border:none;background:var(--bg-3,#f0eee9);border-radius:10px;width:38px;height:38px;font-size:18px;cursor:pointer">▶</button>' +
      '<div style="text-align:center;flex:1"><div id="date-nav-label" style="font-weight:700;font-size:15px">היום</div><div id="date-nav-back" class="link-btn" style="font-size:12px;color:var(--gold);cursor:pointer;display:none" onclick="dayNavToday()">חזרה להיום</div></div>' +
      '<button id="date-next" onclick="dayNavNext()" aria-label="יום הבא" style="border:none;background:var(--bg-3,#f0eee9);border-radius:10px;width:38px;height:38px;font-size:18px;cursor:pointer">◀</button>';
    sc.insertBefore(bar, sc.firstChild);
  }
  function updateDateNav() {
    ensureDateNav();
    const label = document.getElementById('date-nav-label');
    const back = document.getElementById('date-nav-back');
    const prev = document.getElementById('date-prev');
    const next = document.getElementById('date-next');
    if (label) label.textContent = formatDayLabel(currentDayKey);
    if (back) back.style.display = viewingToday() ? 'none' : 'block';
    // prev = אחורה בזמן; חסום כשהגענו לגבול
    if (prev) { const atLimit = daysBack(currentDayKey) >= MAX_PAST_DAYS; prev.disabled = atLimit; prev.style.opacity = atLimit ? '.35' : '1'; }
    // next = קדימה בזמן; חסום כשאנחנו על היום (אין עתיד)
    if (next) { const atToday = viewingToday(); next.disabled = atToday; next.style.opacity = atToday ? '.35' : '1'; }
  }

  // ── טעינת יום לצפייה/עריכה ──
  async function loadDay(key) {
    if (key === currentDayKey) return;
    if (key === getTodayKey()) {
      // חזרה להיום — משחזרים את נתוני היום האמיתי
      todayData = realTodayData;
      waterCount = realWaterCount;
      currentDayKey = getTodayKey();
    } else {
      // עוזבים את היום — שומרים את נתוני היום האמיתי לפני ההחלפה
      if (viewingToday()) { realTodayData = todayData; realWaterCount = waterCount; }
      let data = { meals: [], burned: 0, steps: 0 }, water = 0;
      try {
        const doc = await DayRepository.loadDay(currentUser.uid, key);
        if (doc.exists) { const d = doc.data(); data = { meals: d.meals || [], burned: d.burned || 0, steps: d.steps || 0 }; water = d.water || 0; }
      } catch (e) { console.error('loadDay:', e); }
      todayData = data;
      waterCount = water;
      currentDayKey = key;
    }
    renderHome();
    updateFoodDateBanner();
  }

  function shiftDay(deltaDays) {
    const d = keyToDate(currentDayKey);
    d.setDate(d.getDate() + deltaDays);
    let key = dateKey(d);
    // מגבלות: לא לעתיד, ולא מעבר ל-MAX_PAST_DAYS אחורה
    if (keyToDate(key) > keyToDate(getTodayKey())) key = getTodayKey();
    if (daysBack(key) > MAX_PAST_DAYS) return;
    loadDay(key);
  }
  window.dayNavPrev = () => shiftDay(-1);   // אחורה בזמן
  window.dayNavNext = () => shiftDay(1);     // קדימה בזמן
  window.dayNavToday = () => loadDay(getTodayKey());

  // ── כרום מסך הבית לפי היום המוצג ──
  function applyDayViewChrome() {
    const today = viewingToday();
    const setHidden = (id, cond) => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', cond); };
    // מקטעים ששייכים ל"היום" בלבד — מוסתרים בימי עבר
    ['week-header', 'week-chart', 'body-metrics-section'].forEach(id => setHidden(id, !today));
    // כרטיסי מאמן/יעד — לא רצים על ימי עבר
    if (!today) ['trigger-card', 'coach-card', 'adaptive-card', 'partial-prompt'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    const mt = document.getElementById('meals-title');
    if (mt) mt.textContent = today ? 'ארוחות היום' : ('ארוחות · ' + formatDayLabel(currentDayKey));
    updateDateNav();
  }

  // ── עטיפת renderHome: מוסיפה סרגל תאריך + כרום עבר ──
  const _renderHome = renderHome;
  renderHome = function () {
    _renderHome();
    ensureDateNav();
    applyDayViewChrome();
  };

  // ── עטיפת renderMealsInHome: שורות לחיצות לעריכה + כפתור מחיקה, בכל יום ──
  renderMealsInHome = function () {
    const list = document.getElementById('meals-list');
    if (!list) return;
    if (!todayData.meals.length) { list.innerHTML = '<div class="empty-state">לא נרשמו ארוחות</div>'; return; }
    list.innerHTML = '<div class="meals-card">' + todayData.meals.map((m, i) =>
      '<div class="meal-row">' +
        '<div style="flex:1;cursor:pointer" onclick="editHomeMeal(' + i + ')"><div class="meal-name">' + esc(m.name) + ' <span style="font-size:11px;color:var(--gold)">✏️</span></div><div class="meal-time">' + esc(m.time || '') + '</div></div>' +
        '<div class="meal-kcal">' + (m.kcal || 0) + ' קל\'</div>' +
        '<button onclick="deleteHomeMeal(' + i + ')" aria-label="מחק" style="border:none;background:none;color:var(--text-3,#999);font-size:20px;cursor:pointer;padding:0 4px;margin-inline-start:6px">×</button>' +
      '</div>'
    ).join('') + '</div>';
  };

  window.deleteHomeMeal = async function (idx) {
    if (!todayData.meals[idx]) return;
    if (!confirm('למחוק את הארוחה?')) return;
    todayData.meals.splice(idx, 1);
    await saveTodayData();
    await updateStreak();
    renderHome();
    if (typeof renderFoodMeals === 'function') renderFoodMeals();
  };

  // ── עטיפת showMealEditor: איפוס מצב עריכה בכל פתיחה של ארוחה חדשה ──
  const _showMealEditor = showMealEditor;
  showMealEditor = function (meal) { editingExisting = null; _showMealEditor(meal); };

  // ── עריכת ארוחה קיימת דרך המסך האחיד ──
  window.editHomeMeal = function (idx) {
    const meal = todayData.meals[idx];
    if (!meal) return;
    const time = meal.time || '';
    const items = (meal.items && meal.items.length)
      ? meal.items.map(it => ({ ...it }))
      : [{ name: meal.name || 'פריט', amount: 0, unit: '', qty: 1, kcal: meal.kcal || 0, protein: meal.protein || 0, carbs: meal.carbs || 0, fat: meal.fat || 0, fiber: meal.fiber || 0, sugar: meal.sugar || 0, sodium: meal.sodium || 0 }];
    goToScreen('food');
    showMealEditor({ name: meal.name, items: items, source: meal.source || null, note: meal.note || '' }); // מאפס את הדגל ומרנדר כרגיל
    editingExisting = { idx: idx, time: time };  // מפעיל מצב עריכה
    renderEditor();                               // מרנדר מחדש עם כפתורי העריכה
  };

  // ── מצב עריכה קיים: addMeal מנותב לשמירת שינויים ──
  const _addMeal = addMeal;
  addMeal = async function () {
    if (editingExisting) return saveEditedMeal();
    return _addMeal();
  };

  window.saveEditedMeal = async function () {
    if (!pendingMeal || !pendingMeal.items.length) { alert('אין פריטים בארוחה'); return; }
    const finalMeal = buildMealFromEditor();
    if (editingExisting.time) finalMeal.time = editingExisting.time; // שמירה על שעת הרישום המקורית
    todayData.meals[editingExisting.idx] = finalMeal;
    editingExisting = null;
    pendingMeal = null;
    document.getElementById('food-result').classList.add('hidden');
    await saveTodayData();
    await updateStreak();
    if (typeof renderFoodMeals === 'function') renderFoodMeals();
    goToScreen('home');
  };

  window.deleteEditedMeal = async function () {
    if (!editingExisting) return;
    if (!confirm('למחוק את הארוחה?')) return;
    todayData.meals.splice(editingExisting.idx, 1);
    editingExisting = null;
    pendingMeal = null;
    document.getElementById('food-result').classList.add('hidden');
    await saveTodayData();
    await updateStreak();
    if (typeof renderFoodMeals === 'function') renderFoodMeals();
    goToScreen('home');
  };

  window.cancelEditedMeal = function () {
    editingExisting = null;
    pendingMeal = null;
    document.getElementById('food-result').classList.add('hidden');
    goToScreen('home');
  };

  // ── עטיפת renderEditor: כשעורכים ארוחה קיימת — כפתורי פעולה מותאמים ──
  const _renderEditor = renderEditor;
  renderEditor = function () {
    _renderEditor();
    if (editingExisting) {
      const actions = document.querySelector('#food-result .result-actions');
      if (actions) actions.innerHTML =
        '<button class="btn-primary" onclick="addMeal()">שמור שינויים ✓</button>' +
        '<button class="btn-ghost" onclick="deleteEditedMeal()">מחק ארוחה 🗑</button>' +
        '<button class="btn-ghost" onclick="cancelEditedMeal()">בטל</button>';
    }
  };

  // ── באנר במסך האוכל: מיידע לאיזה יום נרשם (כשלא היום) ──
  function ensureFoodDateBanner() {
    if (document.getElementById('food-date-banner')) return;
    const sc = document.querySelector('#screen-food .scroll-content');
    if (!sc) return;
    const b = document.createElement('div');
    b.id = 'food-date-banner';
    b.style.cssText = 'display:none;align-items:center;justify-content:space-between;gap:8px;background:var(--gold-light,#faece0);color:var(--gold,#8a5a00);border-radius:12px;padding:8px 12px;margin-bottom:10px;font-size:13px;font-weight:600';
    b.innerHTML = '<span id="food-date-banner-text"></span><span class="link-btn" style="cursor:pointer;text-decoration:underline" onclick="dayNavToday();goToScreen(\'home\')">להיום</span>';
    sc.insertBefore(b, sc.firstChild);
  }
  function updateFoodDateBanner() {
    ensureFoodDateBanner();
    const b = document.getElementById('food-date-banner');
    const t = document.getElementById('food-date-banner-text');
    if (!b || !t) return;
    if (viewingToday()) { b.style.display = 'none'; }
    else { t.textContent = '📅 רושם ליום: ' + formatDayLabel(currentDayKey); b.style.display = 'flex'; }
  }
  window.updateFoodDateBanner = updateFoodDateBanner;

  // ── עטיפת goToScreen: מרעננת את באנר האוכל ──
  const _goToScreen = goToScreen;
  goToScreen = function (name) {
    _goToScreen(name);
    if (name === 'food') updateFoodDateBanner();
  };

  // ── עטיפת loadUserData: איפוס מצב הניווט להיום בכל טעינה ──
  const _loadUserData = loadUserData;
  loadUserData = async function () {
    const _gen = SessionLifecycle.getGeneration(); // REM-002: session guard
    await _loadUserData();
    if (!SessionLifecycle.isCurrent(_gen)) return; // סשן הוחלף תוך כדי — לא עוקפים את מצב הניווט הנוכחי
    currentDayKey = getTodayKey();
    realTodayData = todayData;
    realWaterCount = waterCount;
  };
})();


// B4 §27: ממפה StateCommandResult (B3) לצורת ה-persistence המצומצמת שאדפטרי ה-Registry
// שמים תחת output.persistence — לא top-level EngineRunResult.persistence (הרישום כבר
// סגור ב-js/engineRegistry.js:normalizeResult, ו-B4 אינו נוגע בו — Engineering
// Readiness Review §40 Q15). requestId/persistenceStatus מגיעים מ-mapPersistenceResult
// ב-js/stateAccess.js (metadata.persistenceRequestId / metadata.persistenceStatus).
function persistenceSummary(result) {
  if (!result) return { requested: false, status: null, requestId: null };
  var status = (result.metadata && result.metadata.persistenceStatus) || (result.status === 'APPLIED' ? 'SUCCESS' : 'FAILED');
  var requestId = (result.metadata && result.metadata.persistenceRequestId) || null;
  return { requested: true, status: status, requestId: requestId };
}

// ══════════════════════════════════════════════════════════════════
// ── C1-WP9: Habit Engine — producer logic extracted to js/engines/habitEngine.js
// (STAGE 6 / TASK-002 original; detectors, lifecycle, and the runHabitEngine /
// runHabitEngineSingleFlight orchestration all moved unchanged). app.js keeps
// only the compatibility facade the WP0 window-assignment inventory locks in
// (window.runHabitEngine — tests/c1Wp0Characterization.test.js). See
// docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
function runHabitEngine(access) { return HabitEngine.runHabitEngine(access); }
window.runHabitEngine = runHabitEngine;

// ══════════════════════════════════════════════════════════════════
// ── C1-WP9: Pattern Engine — producer logic extracted to js/engines/patternEngine.js
// (STAGE 7 / TASK-003 original; detectors, fingerprinting, and the runPatternEngine
// orchestration all moved unchanged, including its soft internal call to
// HabitEngine.runHabitEngineSingleFlight()). app.js keeps only the compatibility
// facade the WP0 window-assignment inventory locks in (window.runPatternEngine —
// tests/c1Wp0Characterization.test.js). See docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
function runPatternEngine(access) { return PatternEngine.runPatternEngine(access); }
window.runPatternEngine = runPatternEngine;

// ══════════════════════════════════════════════════════════════════
// ── STAGE 8 / B2 (v2.21.0): Engine Registry / Orchestrator wiring ──
// מחליף את מנגנוני ה-override-chain של Stages 4-7 (showApp/logWeight/
// saveWorkout/scheduleLocalNotifications) עבור ארבעת המנועים בלבד.
// כל אדפטר קורא לפונקציה הקיימת והבלתי-משתנה של המנוע — אין שינוי
// ללוגיקה העסקית. ראה docs/tasks/B2/B2_SPEC.md.
// ══════════════════════════════════════════════════════════════════

// B4: מזריק את מבצעי ה-Firestore בפועל (db, טרנזקציות) לתוך js/persistenceGateway.js —
// המודול עצמו אינו נוגע ב-Firestore/window ישירות, בדיוק כמו js/stateAccess.js (B3),
// כדי שיישאר ניתן לבדיקה עצמאית ב-Node. engineRegistry.js אינו נוגע בכך כלל.
PersistenceGateway.configure({
  isSessionCurrent: function (gen) { return SessionLifecycle.isCurrent(gen); },
  mergeUserFields: function (uid, fields) {
    return db.collection('users').doc(uid).set(fields, { merge: true });
  },
  replaceDayDocument: function (uid, payload) {
    return db.collection('users').doc(uid).collection('days').doc(currentDayKey).set({
      meals: payload.meals, burned: payload.burned, steps: payload.steps, water: payload.water,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },
  // Pattern בלבד: expectedVersion נבדק אטומית מול coachMemory.patternsMeta.sourceFingerprint
  // ה-durable בתוך טרנזקציה (B4 §16.2/§24) — לא ניתן לאכוף CAS אמיתי עם set/merge פשוט.
  runPatternTransaction: function (uid, payload, expectedVersion) {
    var ref = db.collection('users').doc(uid);
    return db.runTransaction(function (tx) {
      return tx.get(ref).then(function (snap) {
        var data = snap.data() || {};
        var currentFingerprint = data.coachMemory && data.coachMemory.patternsMeta && data.coachMemory.patternsMeta.sourceFingerprint;
        if (expectedVersion !== null && typeof expectedVersion !== 'undefined' && currentFingerprint !== expectedVersion) {
          var err = new Error('pattern expectedVersion mismatch');
          err.conflict = true; err.currentVersion = currentFingerprint;
          throw err;
        }
        tx.set(ref, { coachMemory: { patterns: payload.patterns, patternsMeta: payload.patternsMeta } }, { merge: true });
        return { version: payload.patternsMeta && payload.patternsMeta.sourceFingerprint };
      });
    });
  }
});

// B3: מזריק את התלויות האמיתיות (userProfile, todayData וכו') לתוך js/stateAccess.js.
// engineRegistry.js אינו נוגע בכך כלל — ה-configure קורה כאן, ב-app.js, לפני שאדפטר
// כלשהו עשוי להיקרא בפועל. B4: persistHabitsView/persistPatternView/recordCoachEvent/
// markTriggerFired בונים PersistenceRequest טיפוסי ומעבירים ל-PersistenceGateway.persist()
// במקום saveProfile()/db ישיר — db עצמו נחשף רק בתוך PersistenceGateway.configure לעיל.
StateAccess.configure({
  getUserProfile: function () { return userProfile; },
  getCurrentUser: function () { return currentUser; },
  getTodayData: function () { return todayData; },
  getTodayConsumed: todayConsumed,
  getTodayProtein: todayProtein,
  getTodayBurned: function () { return (todayData && todayData.burned) || 0; },
  fetchHistory: getHistoryData,
  persistHabitsView: function (identity, command) {
    return PersistenceGateway.persist({
      requestId: 'habits-' + identity.userId + '-' + (identity.runId || Date.now()),
      operation: 'DERIVED_HABITS_REPLACE',
      domain: 'DERIVED_INTELLIGENCE',
      owner: 'habitState',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      payload: { habits: command.habits, habitsMeta: command.habitsMeta },
      authority: command.habitsMeta && command.habitsMeta.authority,
      expectedVersion: null,
      idempotencyKey: null,
      createdAt: Date.now(),
      metadata: { engineId: 'habitEngine', engineVersion: command.habitsMeta && command.habitsMeta.version, trigger: 'APP_READY', runId: identity.runId }
    });
  },
  persistPatternView: function (identity, command) {
    return PersistenceGateway.persist({
      requestId: 'patterns-' + identity.userId + '-' + (identity.runId || Date.now()),
      operation: 'DERIVED_PATTERNS_REPLACE',
      domain: 'DERIVED_INTELLIGENCE',
      owner: 'patternState',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      payload: { patterns: command.patterns, patternsMeta: command.patternsMeta },
      authority: command.patternsMeta && command.patternsMeta.authority,
      expectedVersion: (typeof command.expectedVersion !== 'undefined') ? command.expectedVersion : null,
      idempotencyKey: null,
      createdAt: Date.now(),
      metadata: { engineId: 'patternEngine', engineVersion: command.patternsMeta && command.patternsMeta.version, trigger: 'APP_READY', runId: identity.runId }
    });
  },
  isSessionCurrent: function (gen) { return SessionLifecycle.isCurrent(gen); },
  ensureCoachMemoryShape: ensureCoachMemory,
  setAdaptProposal: function (proposal) { _adaptProposal = proposal; },
  setAdaptHistoryCache: function (history) { window._adaptHistoryCache = history; },
  // Implementation Review correction (B4 §26 כלל 6, מיושר ל-Habit/Pattern rollback): לפני
  // B4, saveProfile() לא נדחה אף פעם — עכשיו כשל durable אמיתי בלי rollback היה משאיר את
  // ה-type ב-cd.fired לצמיתות (עד חילוף היום), וחוסם retry עתידי דרך canFire() על סמך מצב
  // שמעולם לא נשמר. recordCoachEvent פחות קריטי (הרשומה לא "נעלמת", רק ממתינה לסנכרון הבא)
  // אך מיושר לעקביות עם דפוס ה-rollback הקיים.
  recordCoachEvent: function (identity, type, meta) {
    if (!userProfile) return Promise.resolve(null);
    ensureCoachMemory();
    var snapshot = userProfile.coachEvents;
    var nextEvents = snapshot.concat([{ type: type, date: getTodayKey(), ts: Date.now(), meta: meta || {} }]);
    if (nextEvents.length > COACH_EVENTS_CAP) nextEvents = nextEvents.slice(-COACH_EVENTS_CAP);
    userProfile.coachEvents = nextEvents;
    return PersistenceGateway.persist({
      requestId: 'trigger-event-' + identity.userId + '-' + (identity.runId || Date.now()) + '-' + type,
      operation: 'TRIGGER_RECORD_EVENT',
      domain: 'SYSTEM_METADATA',
      owner: 'triggerState',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      payload: { coachEvents: nextEvents },
      authority: null,
      expectedVersion: null,
      // append-style (B4 §23 כלל 3) — יציב per user/type/day, תואם לגרנולריות ה-dedup
      // הקיימת של canFire (upstream), כך שאותו type לא באמת "יבקש" מפתח פעמיים ביום.
      idempotencyKey: identity.userId + ':' + type + ':' + getTodayKey(),
      createdAt: Date.now(),
      metadata: { engineId: 'triggerEngine', runId: identity.runId }
    }).then(function (pr) {
      if (userProfile && pr && pr.status !== 'SUCCESS' && pr.status !== 'NO_OP') userProfile.coachEvents = snapshot;
      return pr;
    });
  },
  markTriggerFired: function (identity, type) {
    var cd = coachDay();
    var snapshotFired = cd.fired.slice(), snapshotCount = cd.count;
    if (cd.fired.indexOf(type) < 0) cd.fired.push(type);
    cd.count++;
    return PersistenceGateway.persist({
      requestId: 'trigger-budget-' + identity.userId + '-' + (identity.runId || Date.now()) + '-' + type,
      operation: 'TRIGGER_UPDATE_BUDGET',
      domain: 'SYSTEM_METADATA',
      owner: 'triggerState',
      userId: identity.userId,
      sessionGeneration: identity.sessionGeneration,
      payload: { coachDay: cd },
      authority: null,
      expectedVersion: null,
      idempotencyKey: null,
      createdAt: Date.now(),
      metadata: { engineId: 'triggerEngine', runId: identity.runId }
    }).then(function (pr) {
      if (pr && pr.status !== 'SUCCESS' && pr.status !== 'NO_OP') { cd.fired = snapshotFired; cd.count = snapshotCount; }
      return pr;
    });
  },
  checkCanFire: canFire,
  getTriggerBudget: coachDay
});

// B5: מזריק תלויות ל-derivedIntelligenceConsumer.js — קורא Habit/Pattern Derived
// Intelligence Views אך ורק דרך B3 State Access (capability חדש
// 'derivedIntelligenceConsumer'/'BUILD', ר' js/stateAccess.js), לא ישירות מ-coachMemory.
// אינו נרשם ב-EngineRegistry — אינו B2 Engine (ADR-B5-008), אלא capability-holder בלבד.
DerivedIntelligenceConsumer.configure({
  isSessionCurrent: function (gen) { return SessionLifecycle.isCurrent(gen); },
  readHabitSnapshot: function (session) {
    return StateAccess.createEngineAccess({
      engineId: 'derivedIntelligenceConsumer', action: 'BUILD',
      userId: session.uid, sessionGeneration: session.generation, runId: null
    }).read.habitView();
  },
  readPatternSnapshot: function (session) {
    return StateAccess.createEngineAccess({
      engineId: 'derivedIntelligenceConsumer', action: 'BUILD',
      userId: session.uid, sessionGeneration: session.generation, runId: null
    }).read.patternView();
  },
  getLocalDate: function () { return getTodayKey(); },
  getWeekday: function () { return new Date().getDay(); }
});

// context בסיסי (ללא action/payload — אלה נבנים לכל engine בנפרד) — B2 SPEC §6.
function engineRunContextBase() {
  return {
    userId: currentUser && currentUser.uid,
    sessionGeneration: SessionLifecycle.getGeneration(),
    now: Date.now()
  };
}

// APP_READY — action מפורש ונפרד לכל אחד מארבעת המנועים (B2 Code Review Round 4:
// אין יותר action משותף/undefined-default יחיד לכל ה-engines). לא חוסם עלייה
// (תואם להתנהגות Stages 4-7 הקודמת: showApp עצמה אינה async).
function runAppReadyEngines() {
  try {
    EngineRegistry.run({
      trigger: 'APP_READY',
      actions: {
        habitEngine: 'RECOMPUTE',
        patternEngine: 'RECOMPUTE',
        adaptiveTdeeEngine: 'ADAPTIVE_CHECK',
        triggerEngine: 'DAILY_COACH_CHECK'
      },
      context: engineRunContextBase()
    }).catch(function () {});
  } catch (e) { /* לעולם לא שובר עלייה */ }
}

// helper גנרי: action בודד למנוע בודד (SOURCE_DATA_CHANGED/MANUAL) — משתמש
// ב-EngineRegistry.run() עם מפת actions/payloads בעלת מפתח יחיד, כך שה-action
// וה-payload מגיעים אך ורק ל-engine המבוקש ולא לאף engine זכאי-trigger אחר.
async function runEngineAction(trigger, engineId, action, payload) {
  var actions = {}; actions[engineId] = action;
  var request = { trigger: trigger, actions: actions, context: engineRunContextBase() };
  if (typeof payload !== 'undefined') { var payloads = {}; payloads[engineId] = payload; request.payloads = payloads; }
  try { return await EngineRegistry.run(request); } catch (e) { /* לא זורק החוצה */ }
}

// AUTH_SESSION_READY — לא חוסם, תואם להתנהגות initNotifications() הקודמת.
function runAuthSessionReadyEngines() {
  try { runEngineAction('AUTH_SESSION_READY', 'triggerEngine', 'LOCAL_NOTIFICATION_SCHEDULE'); }
  catch (e) { /* לעולם לא שובר עלייה */ }
}

// ══════════════════════════════════════════════════════════════════
// ── C1-WP9: Engine Registry composition — relocated to js/engines/registerEngines.js.
// The Habit Engine single-flight wrapper moved into js/engines/habitEngine.js; the
// adaptiveTdeeEngine/triggerEngine registration adapters moved into
// js/engines/adaptiveTdeeEngineAdapter.js / js/engines/triggerEngineAdapter.js. app.js
// now only configures the four modules (above) and triggers registration once, at
// composition time — no engine business logic remains here. See
// docs/specs/C1_SPEC_v1.0.md §C1-WP9.
// ══════════════════════════════════════════════════════════════════
RegisterEngines.registerAll();
