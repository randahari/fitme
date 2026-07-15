// ── GLOBALS ──
const APP_VERSION = '2.17.1';
const CLAUDE_PROXY_URL = 'https://us-central1-fitme-f9289.cloudfunctions.net/anthropicProxy';

// עוזר לקריאת Claude דרך ה-proxy שלנו (בלי לדרוש מפתח API אישי)
async function callClaude(body) {
  if (!currentUser) throw new Error('לא מחובר');
  const token = await currentUser.getIdToken();
  const res = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'שגיאת שרת');
  return data;
}

const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };
const DAYS_HE = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];

// ── COACH (המאמן) ──
const COACH_STYLE_LABELS = { friendly: 'חברי', supportive: 'תומך', professional: 'מקצועי', mixed: 'מעורב' };
const COACH_CHATTER_LABELS = { minimal: 'קצר ולעניין', balanced: 'מאוזן', gentle: 'עדין' };
const COACH_STYLE_GUIDE = {
  friendly: 'דבר בטון חם, יומיומי וקליל, כמו חבר טוב. מותר הומור עדין.',
  supportive: 'דבר בטון תומך, מעודד ורגיש. שים דגש על חיזוק והבנה.',
  professional: 'דבר בטון ענייני, מדויק וממוקד. בלי סלנג, בלי קישוטים מיותרים.',
  mixed: 'שלב חום ידידותי עם דיוק ענייני — נעים אבל לא מתחנחן.'
};
const COACH_CHATTER_GUIDE = {
  minimal: 'משפט אחד קצר בלבד. בלי פתיח, בלי סיכום. רק העיקר.',
  balanced: 'עד 2 משפטים. נעים וקולע.',
  gentle: '2–3 משפטים חמים ומלווים, עם מילת עידוד אמיתית.'
};
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

// ── AUTH ──
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData();
    if (userProfile) {
      showApp();
      initNotifications();
    } else {
      showOnboarding();
    }
  } else {
    currentUser = null;
    userProfile = null;
    showLogin();
  }
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
}

// signInWithGoogle מוגדר ב-firebase-config.js (redirect באייפון/PWA, popup בדסקטופ)

async function signOut() {
  if (confirm('להתנתק?')) await auth.signOut();
}

// ── FIRESTORE ──
async function loadUserData() {
  if (!currentUser) return;
  try {
    // PERF-001: שלוש הקריאות עצמאיות — מונפקות במקביל (Promise.all) במקום טורית.
    const todayKey = getTodayKey();
    const userRef = db.collection('users').doc(currentUser.uid);
    const [profileDoc, todayDoc, favDoc] = await Promise.all([
      userRef.get(),
      userRef.collection('days').doc(todayKey).get(),
      userRef.collection('data').doc('favorites').get()
    ]);
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
  try { await db.collection('users').doc(currentUser.uid).set(userProfile, { merge: true }); }
  catch(e) { console.error('saveProfile:', e); }
}

async function saveTodayData() {
  if (!currentUser) return;
  try {
    await db.collection('users').doc(currentUser.uid).collection('days').doc(currentDayKey).set({
      meals: todayData.meals, burned: todayData.burned, steps: todayData.steps, water: waterCount,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.error('saveTodayData:', e); }
}

async function saveFavorites() {
  if (!currentUser) return;
  try { await db.collection('users').doc(currentUser.uid).collection('data').doc('favorites').set({ meals: favoriteMeals }); }
  catch(e) { console.error('saveFavorites:', e); }
}

async function getHistoryData() {
  if (!currentUser) return {};
  const history = {};
  try {
    // BUGFIX-001: orderBy(documentId(),'desc') דרש אינדקס single-field ידני ונכשל ב-failed-precondition,
    // וה-catch הריק בלע את השגיאה — ההיסטוריה חזרה {} וכל הצרכנים קיבלו תמונה ריקה.
    // קריאה בלי orderBy ובלי limit אינה דורשת אינדקס כלל. מזהי המסמכים הם YYYY-MM-DD
    // ולכן ממוינים כרונולוגית מעצמם — המיון והחיתוך ל-400 האחרונים נעשים ב-JS,
    // כך נשמרת התנהגות "400 ימי הרישום האחרונים" גם בהיסטוריה דלילה עם פערים.
    const snap = await db.collection('users').doc(currentUser.uid).collection('days').get();
    const docs = [];
    snap.forEach(doc => { docs.push(doc); });
    docs.sort((a, b) => (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)));
    docs.slice(-400).forEach(doc => { history[doc.id] = doc.data(); });
  } catch(e) { console.error('getHistoryData:', e); }
  return history;
}

async function getGroupMembers() {
  if (!currentUser || !userProfile || !userProfile.groupId) return [];
  try {
    const snap = await db.collection('groups').doc(userProfile.groupId).collection('members').get();
    const members = [];
    for (const doc of snap.docs) {
      const uid = doc.id;
      const profileDoc = await db.collection('users').doc(uid).get();
      if (profileDoc.exists) {
        const p = profileDoc.data();
        const todayDoc = await db.collection('users').doc(uid).collection('days').doc(getTodayKey()).get();
        const todayKcal = todayDoc.exists ? (todayDoc.data().meals||[]).reduce((s,m)=>s+(m.kcal||0),0) : 0;
        members.push({ uid, name: p.name, goal: p.goalKcal, kcal: todayKcal, streak: p.streak||0, isMe: uid === currentUser.uid });
      }
    }
    return members;
  } catch(e) { return []; }
}

function dateKey(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function getTodayKey() { return dateKey(new Date()); }
function generateGroupCode() { return Math.random().toString(36).substr(2,6).toUpperCase(); }

// ── NOTIFICATIONS ──
async function initNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (Notification.permission === 'default') {
    setTimeout(() => requestNotificationPermission(), 3000);
  }
  scheduleLocalNotifications();
}

async function requestNotificationPermission() {
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    sendLocalNotification('FitMe 💪', 'התראות הופעלו! נשלח לך תזכורות יומיות.');
  }
}

function sendLocalNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then(sw => {
    sw.showNotification(title, { body, icon: '/fitme/assets/icon-192.png', dir: 'rtl', lang: 'he', vibrate: [200,100,200] });
  });
}

function scheduleLocalNotifications() {
  if (Notification.permission !== 'granted' || !userProfile) return;
  const now = new Date();
  const hour = now.getHours();
  const name = userProfile.name;

  // Morning 7:00
  if (hour < 7) scheduleAt(7, 0, () => sendLocalNotification('בוקר טוב ' + coachName() + ' ☀️', coachLine('morning', { goal: userProfile.goalKcal })));

  // Water reminders every 2 hours
  [9,11,13,15,17].forEach(h => {
    if (hour < h) scheduleAt(h, 0, () => {
      if (waterCount < 6) sendLocalNotification('💧 זמן לשתות מים', 'שתית רק ' + waterCount + ' כוסות עד עכשיו. תשתה עוד!');
    });
  });

  // Lunch reminder
  if (hour < 13) scheduleAt(13, 0, () => {
    const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
    if (consumed < 400) sendLocalNotification('🍽️ לא שכחת לאכול?', 'רשמת רק ' + consumed + ' קל\' עד עכשיו. מה אכלת היום?');
  });

  // Macro check 17:00
  if (hour < 17) scheduleAt(17, 0, () => {
    const protein = todayData.meals.reduce((s,m)=>s+(m.protein||0),0);
    const targetProtein = Math.round((userProfile.weight||75) * 1.8);
    if (protein < targetProtein * 0.6) sendLocalNotification('📊 בדיקת תזונה', coachLine('protein', { have: Math.round(protein), target: targetProtein }));
  });

  // Evening push 20:00
  if (hour < 20) scheduleAt(20, 0, () => {
    const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
    const remain = userProfile.goalKcal - consumed;
    if (remain > 200) sendLocalNotification('⚡ ' + coachName(), coachLine('evening', { remain }));
  });

  // Streak protection 21:00
  if (hour < 21) scheduleAt(21, 0, () => {
    const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
    if (consumed < 100 && (userProfile.streak||0) > 2) sendLocalNotification('🔥 הסטריק שלך', coachLine('streak', { streak: userProfile.streak }));
  });
}

function scheduleAt(hour, min, callback) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, min, 0, 0);
  const diff = target - now;
  if (diff > 0) setTimeout(callback, diff);
}

// ── COACH ENGINE (המאמן) ──
function coachName() {
  return (userProfile && userProfile.coachName) || (userProfile && userProfile.name) || 'חבר';
}
function coachStyle() { return (userProfile && userProfile.coachStyle) || 'mixed'; }
function coachChatter() { return (userProfile && userProfile.coachChatter) || 'balanced'; }

// הוראת מערכת קצרה שמרכיבה את הדמות מההעדפות — כדי שהמאמן עקבי בכל האפליקציה
function buildCoachSystemPrompt() {
  const p = userProfile || {};
  const f = [];
  if (p.gender) f.push('מין: ' + (p.gender === 'male' ? 'זכר' : 'נקבה'));
  if (p.age) f.push('גיל: ' + p.age);
  const w = p.currentWeight || p.weight;
  if (w) f.push('משקל: ' + w + ' ק"ג');
  if (p.height) f.push('גובה: ' + p.height + ' ס"מ');
  if (p.goal) f.push('מטרה: ' + (GOAL_LABELS[p.goal] || p.goal));
  if (p.goalKcal) f.push('יעד קלוריות יומי: ' + p.goalKcal);
  if (p.days) { const dm = { '2': '2-3', '4': '4-5', '6': '6+' }; f.push('ימי אימון בשבוע: ' + (dm[p.days] || p.days)); }
  if (p.workoutType) f.push('סוג אימון מועדף: ' + p.workoutType);
  if (Array.isArray(p.foods) && p.foods.length) f.push('מאכלים אהובים: ' + p.foods.join(', '));
  if (p.streak) f.push('סטריק נוכחי: ' + p.streak + ' ימים');
  return [
    'אתה "המאמן" — נוכחות אישית באפליקציית תזונה וכושר בשם FitMe.',
    'אתה מדבר עברית בלבד, בגוף ראשון, ופונה למשתמש בשם: ' + coachName() + '.',
    f.length ? ('הכר את מי שאתה מלווה — ' + f.join(' · ') + '. התאם את דבריך למצב ולמטרה שלו, אך אל תדקלם את הנתונים אלא אם הם רלוונטיים להודעה.') : '',
    'אופי: ' + (COACH_STYLE_GUIDE[coachStyle()] || COACH_STYLE_GUIDE.mixed),
    'אורך: ' + (COACH_CHATTER_GUIDE[coachChatter()] || COACH_CHATTER_GUIDE.balanced),
    'לעולם אל תמציא נתונים שלא נמסרו לך. אל תשתמש בכותרות, רשימות או Markdown — טקסט רץ בלבד.',
    'אל תפתח ב"שלום" חוזר בכל הודעה. היה טבעי.'
  ].filter(Boolean).join(' ');
}

// מייצר הודעת מאמן דרך ה-proxy. context = תיאור מצב קצר בעברית.
async function coachMessage(context) {
  const data = await callClaude({
    model: 'claude-sonnet-4-6',
    max_tokens: coachChatter() === 'gentle' ? 220 : 120,
    system: buildCoachSystemPrompt(),
    messages: [{ role: 'user', content: 'המצב כרגע: ' + context + '\nכתוב הודעת מאמן אחת בהתאם לאופי ולאורך שהוגדרו.' }]
  });
  return (data.content && data.content[0] && data.content[0].text || '').trim();
}

// כרטיס המאמן במסך הבית — הודעה חכמה לפי מצב היום (פעם אחת לפתיחה)
async function refreshCoachCard() {
  if (coachCardShown || !userProfile) return;
  coachCardShown = true;
  const card = document.getElementById('coach-card');
  const textEl = document.getElementById('coach-card-text');
  if (!card || !textEl) return;
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  const protein = Math.round(todayData.meals.reduce((s,m)=>s+(m.protein||0),0));
  const targetProtein = Math.round((userProfile.weight||75)*1.8);
  const remain = Math.max(0, userProfile.goalKcal - consumed);
  const hour = new Date().getHours();
  const partOfDay = hour < 11 ? 'בוקר' : hour < 17 ? 'צהריים' : 'ערב';
  const ctx = `עכשיו ${partOfDay}. ${coachName()} פתח את מסך הבית. צרך ${consumed} קל׳ מתוך ${userProfile.goalKcal} (נותרו ${remain}). חלבון ${protein}g מתוך ${targetProtein}g. סטריק ${userProfile.streak||0} ימים. מטרה: ${GOAL_LABELS[userProfile.goal]}. תן משפט מלווה שמתאים לשעה ולמצב — עידוד או טיפ קטן.`;
  try {
    const msg = await coachMessage(ctx);
    if (msg) { textEl.textContent = msg; card.classList.remove('hidden'); }
  } catch(e) { /* שקט — אם אין רשת פשוט לא מציגים כרטיס */ }
}

// טקסט מקומי (בלי רשת) לפי אופי — לתזכורות מיידיות/התראות, לאמינות ומהירות
function coachLine(kind, d) {
  const n = coachName();
  const warm = coachChatter() === 'gentle';
  const pro = coachStyle() === 'professional' || coachChatter() === 'minimal';
  const T = {
    morning:   pro ? `בוקר טוב. יעד היום: ${d.goal} קל׳.` : warm ? `בוקר טוב ${n} ☀️ יום חדש, הזדמנות חדשה. היעד שלך היום: ${d.goal} קל׳.` : `בוקר טוב ${n}! היעד שלך היום: ${d.goal} קל׳.`,
    protein:   pro ? `חלבון: ${d.have}g מתוך ${d.target}g.` : warm ? `${n}, שים לב לחלבון — ${d.have}g מתוך ${d.target}g. ביצה, עוף או קוטג׳ יסגרו את הפער יפה.` : `חסר קצת חלבון: ${d.have}g מתוך ${d.target}g. אולי ביצים או קוטג׳?`,
    evening:   pro ? `נותרו ${d.remain} קל׳ להיום.` : warm ? `${n}, יש לך עוד זמן — נותרו ${d.remain} קל׳ להיום, אתה בכיוון טוב.` : `${n}, נותרו ${d.remain} קל׳ להיום. תספיק!`,
    streak:    pro ? `סטריק ${d.streak} ימים — טרם נרשמה ארוחה היום.` : warm ? `${n}, הסטריק היפה שלך (${d.streak} ימים) מחכה — רישום קטן אחד וזה נשמר 🔥` : `אל תשבור את הסטריק! ${d.streak} ימים בסכנה — רשום משהו 🔥`,
    achieve:   pro ? `הישג חדש: ${d.title}.` : warm ? `${n}, כל הכבוד! פתחת הישג: ${d.title} ${d.icon}` : `הישג חדש ${d.icon} — ${d.title}!`,
    workout:   pro ? `אימון נשמר. ${d.burn} קל׳.` : warm ? `${n}, אלוף! אימון נשמר ושרפת ${d.burn} קל׳ 💪` : `אימון נשמר! שרפת ${d.burn} קל׳ 💪`
  };
  return T[kind] || '';
}

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
  await db.collection('groups').doc(groupCode).collection('members').doc(currentUser.uid).set({ joinedAt: firebase.firestore.FieldValue.serverTimestamp() });
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
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 600, messages: [{ role: 'user', content: `המשתמש רשם: "${input}". צור שאלון קצר לחישוב תזונתי מדויק. החזר JSON בלבד:
{"questions":[{"q":"שאלה בעברית","options":["אפשרות 1","אפשרות 2","אפשרות 3"]}]}
כללים חשובים:
- אם זו מנה מורכבת מכמה רכיבים (כמו פסטה ברוטב, אורז עם עוף, כריך) — השאלות חייבות לברר את הכמות של כל רכיב מרכזי בנפרד (למשל: "כמה ספגטי?" ו"כמה רוטב בשר?"), לא רק "גודל מנה" כללי.
- אפשרויות הכמות חייבות להיות מוחשיות: גרמים, כפות, כוסות, יחידות ("צלחת קטנה ~150 גרם").
- אם רלוונטי, שאל על סוג (בשר בקר/הודו) או שיטת בישול (מטוגן/אפוי).
- עד 3 שאלות. אל תשאל על מה שכבר ברור מהטקסט. אל תוסיף טקסט מחוץ ל-JSON.` }] });
    const parsed = parseModelJSON(data.content[0].text);
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

const ITEMS_JSON_SPEC = `{"name":"שם המנה בעברית","items":[{"name":"רכיב","amount":150,"unit":"גרם","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}],"suggestions":[{"name":"תוספת","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}],"note":"הערה קצרה על בסיס ההערכה"}`;

async function calculateFoodResult() {
  document.getElementById('food-questionnaire').classList.add('hidden');
  document.getElementById('food-loading').classList.remove('hidden');
  const answersText = foodSession.answers.map(a=>`${a.q}: ${a.a}`).join(', ');
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 1200, messages: [{ role: 'user', content: `חשב ערכים תזונתיים: מאכל: "${foodSession.originalInput}", פרטים: ${answersText}.
פרק את המנה לרכיבים נפרדים (כל רכיב בשורה משלו עם כמות וערכים משלו). ב-suggestions כלול 2-4 "קלוריות נסתרות" אופייניות למנה כזו שהמשתמש אולי שכח (שמן בבישול, גבינה מגוררת, לחם ליד, רוטב) — עם ערכים לכמות טיפוסית. sodium במ"ג, השאר בגרם. החזר JSON בלבד במבנה: ${ITEMS_JSON_SPEC}` }] });
    const meal = parseModelJSON(data.content[0].text);
    showMealEditor(meal);
  } catch(e) { alert('שגיאה בחישוב.'); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

function startCamera() { photoMode = 'plate'; document.getElementById('camera-input').click(); }
function startLabelCamera() { photoMode = 'label'; document.getElementById('camera-input').click(); }

const PLATE_PROMPT = `זהה כל פריט מאכל בצלחת בנפרד — כל רכיב בשורה משלו עם הערכת כמות (גרם/יחידות/כפות) וערכים תזונתיים משלו. אל תאחד הכל לשורה אחת.
ב-suggestions כלול 2-4 "קלוריות נסתרות" שהמצלמה לא רואה אבל אופייניות למנה כזו (שמן בבישול/בטיגון, גבינה מגוררת, רוטב, חמאה) — עם ערכים לכמות טיפוסית.
sodium במ"ג, השאר בגרם. אם התמונה לא ברורה ציין זאת ב-note. חשוב: החזר JSON תקין בלבד — בלי שום טקסט, הסבר או הקדמה לפני או אחרי ה-JSON. התו הראשון בתשובה חייב להיות { והתו האחרון }. המבנה: `;

const LABEL_PROMPT = `בתמונה תווית ערכים תזונתיים של מוצר מזון. קרא את הטבלה בזהירות והחזר פריט אחד מדויק.
כללים מחייבים:
1. קרא קודם את משקל הנטו של המוצר (מופיע כ"משקל נטו" / "תכולה"). זו הכמות של מנה שלמה.
2. בטבלה יש לרוב שתי עמודות: "ל-100 גרם" ו"למנה"/"ליחידה". קח את כל הערכים מ*אותה עמודה בלבד* — אל תערבב בין העמודות. העדף את עמודת המנה (לפי משקל הנטו). אם קיימת רק עמודת 100 גרם — השתמש בה וציין זאת ב-note.
3. amount = הכמות בגרם של הבסיס שבחרת (למשל משקל הנטו), unit = "גרם". name = שם המוצר אם מופיע, אחרת "מוצר מהתווית".
4. sodium במ"ג. אם רשום רק מלח: נתרן(מ"ג) = מלח(גרם) ÷ 2.5 × 1000.
5. בדיקה עצמית לפני החזרה: חומצות שומן רוויות ≤ שומן כולל; סוכר ≤ פחמימות; והקלוריות בערך שוות ל: חלבון×4 + פחמימות×4 + שומן×9. אם משהו לא מסתדר — קרא שוב את הטבלה ותקן.
6. ב-note ציין על איזה בסיס חושבו הערכים (כמה גרם).
suggestions = מערך ריק. אם התווית לא קריאה החזר {"error":"לא קריא"}. חשוב: החזר JSON תקין בלבד — בלי שום טקסט, הסבר או הקדמה לפני או אחרי ה-JSON. התו הראשון בתשובה חייב להיות { והתו האחרון }. המבנה: `;

// דחיסת תמונה לפני שליחה ל-Claude — חוסכת ~70% מהעלות של הקריאה היקרה ביותר.
// מקטינה לרוחב/גובה מקסימלי 1024px ומייצאת JPEG באיכות 0.85.
// אם משהו נכשל — נופלת בחזרה לקובץ המקורי כמו שהוא.
function compressImageForUpload(file, maxDim = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה'));
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onerror = () => resolve({ b64: dataUrl.split(',')[1], mediaType: file.type });
      img.onload = () => {
        try {
          let width = img.width, height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim; }
            else { width = Math.round(width * maxDim / height); height = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve({ b64: out.split(',')[1], mediaType: 'image/jpeg' });
        } catch (err) {
          resolve({ b64: dataUrl.split(',')[1], mediaType: file.type });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function analyzePhoto(input) {
  const file = input.files[0]; if (!file) return;
  input.value = '';
  document.getElementById('food-loading').classList.remove('hidden');
  document.getElementById('food-result').classList.add('hidden');
  const mode = photoMode; photoMode = 'plate';
  try {
    const img = await compressImageForUpload(file);
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 1200, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.b64 } },{ type: 'text', text: (mode==='label' ? LABEL_PROMPT : PLATE_PROMPT) + ITEMS_JSON_SPEC }] }] });
    const meal = parseModelJSON(data.content[0].text);
    if (meal.error) { alert('לא הצלחתי לקרוא את התווית. נסה לצלם שוב מקרוב, באור טוב.'); return; }
    if (mode === 'label') {
      // צילום תווית שהגיע ממסלול ברקוד — נשייך את הברקוד כדי שהתיקון יישמר למאגר הקבוצה
      meal.source = 'label';
      meal.barcode = pendingBarcode;
      pendingBarcode = null;
    } else {
      meal.source = 'plate';
    }
    showMealEditor(meal);
  } catch(e) { alert('שגיאה בניתוח התמונה: ' + e.message); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

// ── BARCODE SCANNER (html5-qrcode — מנוע ZXing + גלאי native, יציב באייפון) ──
let h5qr = null;
let barcodeLastCode = null;
let barcodeHintTimer = null;

async function startBarcode() {
  const overlay = document.getElementById('barcode-overlay');
  if (!overlay) { alert('סריקת ברקוד לא זמינה בדפדפן זה.'); return; }
  overlay.classList.remove('hidden');
  const statusEl = document.getElementById('barcode-status');
  statusEl.textContent = 'מכוון את המצלמה לברקוד...';
  barcodeLastCode = null;

  // טעינת html5-qrcode לפי הצורך (גרסה מקובעת — לא latest)
  if (typeof Html5Qrcode === 'undefined') {
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    } catch(e) { closeBarcode(); alert('טעינת הסורק נכשלה. בדוק חיבור לאינטרנט.'); return; }
  }

  const fmts = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E
  ];

  try {
    h5qr = new Html5Qrcode('barcode-reader', { formatsToSupport: fmts, verbose: false });
  } catch(e) { closeBarcode(); alert('שגיאה באתחול הסורק.'); return; }

  const config = {
    fps: 10,
    qrbox: (vw) => { const w = Math.min(300, Math.round(vw * 0.85)); return { width: w, height: Math.round(w * 0.55) }; },
    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
  };

  armBarcodeHint(statusEl);
  try {
    await h5qr.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => onBarcodeDetected(decodedText, statusEl)
    );
  } catch(e) {
    closeBarcode();
    alert('לא ניתן לפתוח מצלמה. אפשר גישה למצלמה בהגדרות הדפדפן.');
  }
}

function onBarcodeDetected(code, statusEl) {
  if (!code || barcodeLastCode) return; // כבר נתפס — מתעלמים מכפילויות
  barcodeLastCode = code;
  if (statusEl) statusEl.textContent = 'נמצא ברקוד: ' + code + ' — מחפש מוצר...';
  stopBarcodeReader();
  lookupBarcode(code);
}

function armBarcodeHint(statusEl) {
  clearTimeout(barcodeHintTimer);
  barcodeHintTimer = setTimeout(() => {
    if (!barcodeLastCode) statusEl.innerHTML = 'לא מזהה? קרב מעט את הברקוד וודא תאורה — או <button onclick="barcodeToLabel()" style="background:none;border:none;color:var(--gold);text-decoration:underline;font-size:14px;cursor:pointer;font-family:Heebo,sans-serif">צלם תווית במקום</button>';
  }, 20000);
}

function barcodeToLabel() {
  closeBarcode();
  showLabelPrompt('manual-' + Date.now());
}

function stopBarcodeReader() {
  clearTimeout(barcodeHintTimer);
  if (!h5qr) return;
  const r = h5qr; h5qr = null;
  try {
    r.stop().then(() => { try { r.clear(); } catch(e) {} }).catch(() => { try { r.clear(); } catch(e) {} });
  } catch(e) { try { r.clear(); } catch(e2) {} }
}

function closeBarcode() {
  stopBarcodeReader();
  const overlay = document.getElementById('barcode-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ── בקשת צילום תווית (במקום confirm — כדי שהמצלמה תיפתח באייפון) ──
function showLabelPrompt(code) {
  pendingBarcode = code;
  let el = document.getElementById('label-prompt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'label-prompt';
    el.style.cssText = 'position:fixed;inset:0;z-index:350;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Heebo,sans-serif;direction:rtl';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="background:var(--bg);border-radius:16px;padding:22px;max-width:340px;width:100%;text-align:center;border:0.5px solid var(--border-2)">
      <div style="font-size:34px;margin-bottom:8px">🏷️</div>
      <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">המוצר לא נמצא במאגר</div>
      <div style="font-size:13px;color:var(--text-3);line-height:1.5;margin-bottom:16px">צלם את תווית הערכים התזונתיים. Claude יקרא אותה וישמור למאגר הקבוצה — פעם הבאה תזוהה מיד.</div>
      <button onclick="labelPromptCapture()" style="width:100%;padding:14px;background:var(--gold);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:500;font-family:Heebo,sans-serif;cursor:pointer">📷 צלם תווית</button>
      <button onclick="closeLabelPrompt()" style="width:100%;padding:12px;background:none;color:var(--text-2);border:none;font-size:14px;font-family:Heebo,sans-serif;cursor:pointer;margin-top:6px">ביטול</button>
    </div>`;
  el.style.display = 'flex';
}

function labelPromptCapture() {
  closeLabelPrompt();
  startLabelCamera();
}

function closeLabelPrompt() {
  const el = document.getElementById('label-prompt');
  if (el) el.style.display = 'none';
}

// ── מאגר ברקוד משותף לקבוצה ──
function getSharedBarcodeGroup() {
  if (!userProfile) return null;
  return userProfile.groupId || null;
}

async function lookupBarcodeInCache(code) {
  const groupKey = getSharedBarcodeGroup();
  if (!groupKey) return null;
  try {
    const doc = await db.collection('groupBarcodes').doc(groupKey).collection('products').doc(code).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { console.warn('barcode cache read failed:', e.code || e.message); return null; }
}

async function saveBarcodeToCache(code, item, existingAddedByName) {
  const groupKey = getSharedBarcodeGroup();
  if (!groupKey || !code || !item) return;
  // אל תשמור רשומה ריקה (בלי ערכים) — היא רק תזהם את המאגר
  const hasData = (item.kcal||0) > 0 || (item.protein||0) > 0 || (item.carbs||0) > 0 || (item.fat||0) > 0;
  if (!hasData) return;
  // שמור את שם מי שהוסיף במקור; אם זה מוצר חדש — המשתמש הנוכחי
  const addedByName = existingAddedByName || (userProfile ? userProfile.name : '');
  try {
    await db.collection('groupBarcodes').doc(groupKey).collection('products').doc(code).set({
      barcode: code,
      name: item.name, amount: item.amount, unit: item.unit,
      kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat,
      fiber: item.fiber, sugar: item.sugar, sodium: item.sodium,
      addedByName: addedByName,
      updatedByName: userProfile ? userProfile.name : '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch(e) { console.warn('barcode cache save failed:', e.code || e.message); }
}

async function lookupBarcode(code) {
  // 1. מאגר הקבוצה — הכי מהיר, ידני, מדויק. אבל רק אם יש בו ערכים אמיתיים.
  const cached = await lookupBarcodeInCache(code);
  const cachedHasData = cached && ((cached.kcal||0) > 0 || (cached.protein||0) > 0 || (cached.carbs||0) > 0 || (cached.fat||0) > 0);
  if (cachedHasData) {
    closeBarcode();
    const item = {
      name: cached.name, amount: cached.amount, unit: cached.unit,
      kcal: cached.kcal, protein: cached.protein, carbs: cached.carbs, fat: cached.fat,
      fiber: cached.fiber, sugar: cached.sugar, sodium: cached.sodium
    };
    showMealEditor({
      name: cached.name, items: [item], suggestions: [],
      source: 'group', barcode: code, addedByName: cached.addedByName || '',
      note: ''
    });
    return;
  }

  // 2. Open Food Facts — מאגר עולמי חינמי
  try {
    const res = await fetch('https://world.openfoodfacts.org/api/v0/product/' + code + '.json');
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      closeBarcode();
      showLabelPrompt(code);
      return;
    }
    const p = data.product;
    const n = p.nutriments || {};
    const servingSize = p.serving_size ? parseFloat(p.serving_size) : NaN;
    const grams = isNaN(servingSize) ? 100 : servingSize;
    const factor = grams / 100;
    const r1 = v => Math.round((v || 0) * factor * 10) / 10;
    const item = {
      name: p.product_name_he || p.product_name || 'מוצר לא ידוע',
      amount: grams, unit: 'גרם',
      kcal: Math.round((n['energy-kcal_100g'] || n['energy_100g'] || 0) * factor),
      protein: r1(n['proteins_100g']), carbs: r1(n['carbohydrates_100g']), fat: r1(n['fat_100g']),
      fiber: r1(n['fiber_100g']), sugar: r1(n['sugars_100g']),
      sodium: Math.round((n['sodium_100g'] || 0) * factor * 1000)
    };
    // אם למאגר העולמי יש שם אך אין ערכים תזונתיים אמיתיים — התייחס כלא-נמצא ועבור לצילום תווית
    const hasData = item.kcal > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0;
    if (!hasData) {
      closeBarcode();
      showLabelPrompt(code);
      return;
    }
    // הערכים יישמרו למאגר הקבוצה בעת ההוספה ליום (עם הערכים הסופיים, אחרי עריכה אם הייתה)
    closeBarcode();
    showMealEditor({
      name: item.name, items: [item], suggestions: [],
      source: 'off', barcode: code,
      note: isNaN(servingSize) ? 'לפי 100 גרם — התאם כמות עם +/-' : 'לפי מנה (' + p.serving_size + ')'
    });
  } catch(e) {
    closeBarcode();
    alert('שגיאה בחיפוש המוצר. בדוק חיבור לאינטרנט.');
  }
}

// ── מסך עריכה אחיד (תמונה / ברקוד / הקלדה) ──
function esc(s) { return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

// חילוץ JSON עמיד מתשובת המודל — עומד גם אם המודל הוסיף טקסט (בעברית) לפני/אחרי ה-JSON.
function parseModelJSON(raw) {
  let t = String(raw == null ? '' : raw).replace(/```json|```/g, '').trim();
  const firstObj = t.indexOf('{');
  const firstArr = t.indexOf('[');
  if (firstObj === -1 && firstArr === -1) throw new Error('לא נמצא JSON בתשובה');
  let start, endChar;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) { start = firstArr; endChar = ']'; }
  else { start = firstObj; endChar = '}'; }
  const end = t.lastIndexOf(endChar);
  if (end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

function normalizeItem(it) {
  return { name: it.name||'פריט', amount: num(it.amount), unit: it.unit||'', kcal: num(it.kcal),
    protein: num(it.protein), carbs: num(it.carbs), fat: num(it.fat),
    fiber: num(it.fiber), sugar: num(it.sugar), sodium: num(it.sodium), qty: it.qty || 1 };
}

let editingItemIdx = null;
let editingExisting = null; // {idx, time} כשעורכים ארוחה שכבר נרשמה (שלב 2)
function showMealEditor(meal) {
  editingItemIdx = null;
  pendingMeal = {
    name: meal.name || 'ארוחה',
    note: meal.note || '',
    source: meal.source || null,        // 'off' | 'label' | 'group' | 'plate' | null
    barcode: meal.barcode || null,      // אם מלא — שמירה למאגר הקבוצה בעת ההוספה
    addedByName: meal.addedByName || '',
    items: (meal.items||[]).map(normalizeItem),
    suggestions: (meal.suggestions||[]).map(normalizeItem)
  };
  renderEditor();
  document.getElementById('food-result').classList.remove('hidden');
}

// ── תג מקור המידע (מאגר עולמי / תווית / מאגר קבוצה) ──
function sourceBadge() {
  if (!pendingMeal || !pendingMeal.source) return '';
  const map = {
    off:   { icon: '🌐', text: 'מאגר עולמי (Open Food Facts)', bg: 'var(--teal-light)', fg: 'var(--teal)' },
    label: { icon: '📷', text: 'נקרא מהתווית ע"י Claude',       bg: 'var(--gold-light)', fg: 'var(--gold)' },
    group: { icon: '👥', text: 'מהמאגר של הקבוצה' + (pendingMeal.addedByName ? ' · הוסף ע"י ' + pendingMeal.addedByName : ''), bg: 'var(--gold-light)', fg: 'var(--gold)' }
  };
  const s = map[pendingMeal.source];
  if (!s) return '';
  return `<div style="display:inline-flex;align-items:center;gap:6px;background:${s.bg};color:${s.fg};border-radius:20px;padding:5px 12px;font-size:12px;font-weight:500;margin-bottom:10px">${s.icon} ${esc(s.text)}</div>`;
}

function mealTotals() {
  const t = { kcal:0, protein:0, carbs:0, fat:0, fiber:0, sugar:0, sodium:0 };
  if (!pendingMeal) return t;
  pendingMeal.items.forEach(it => {
    t.kcal += it.kcal*it.qty; t.protein += it.protein*it.qty; t.carbs += it.carbs*it.qty;
    t.fat += it.fat*it.qty; t.fiber += it.fiber*it.qty; t.sugar += it.sugar*it.qty; t.sodium += it.sodium*it.qty;
  });
  return t;
}

function fmtQty(q) { return (q % 1 === 0 ? q : q.toFixed(2).replace(/0$/,'')); }

function renderEditor() {
  const box = document.getElementById('food-result');
  if (!box || !pendingMeal) return;
  const t = mealTotals();
  const fld = (lbl, id, val, type) => `<label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--text-3)">${lbl}<input id="${id}" ${type==='text'?'type="text"':'type="number" inputmode="decimal"'} value="${esc(val)}"></label>`;
  const rows = pendingMeal.items.map((it, i) => {
    if (editingItemIdx === i) {
      return `<div class="ed-item" style="flex-direction:column;align-items:stretch;gap:8px">
        ${fld('שם','edit-name',it.name,'text')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${fld('כמות','edit-amount',it.amount)}
          ${fld('יחידה','edit-unit',it.unit,'text')}
          ${fld("קלוריות",'edit-kcal',it.kcal)}
          ${fld('חלבון (g)','edit-protein',it.protein)}
          ${fld('פחמימות (g)','edit-carbs',it.carbs)}
          ${fld('שומן (g)','edit-fat',it.fat)}
          ${fld('סיבים (g)','edit-fiber',it.fiber)}
          ${fld('סוכר (g)','edit-sugar',it.sugar)}
          ${fld('נתרן (mg)','edit-sodium',it.sodium)}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-small" style="flex:1" onclick="editorSaveEdit(${i})">שמור ✓</button>
          <button class="btn-ghost" style="flex:1;margin-top:0;padding:8px" onclick="editorCancelEdit()">בטל</button>
        </div>
      </div>`;
    }
    const amountTxt = it.amount ? `${fmtQty(Math.round(it.amount*it.qty*10)/10)} ${esc(it.unit)}` : '';
    return `<div class="ed-item">
      <button class="ed-del" onclick="editorDelete(${i})" aria-label="הסר פריט">×</button>
      <div class="ed-info" onclick="editorEdit(${i})" style="cursor:pointer">
        <div class="ed-name">${esc(it.name)} <span style="font-size:12px;color:var(--gold)">✏️</span></div>
        <div class="ed-sub">${amountTxt}${amountTxt?' · ':''}${Math.round(it.kcal*it.qty)} קל' · ${Math.round(it.protein*it.qty)}g חלבון</div>
      </div>
      <div class="ed-qty">
        <button onclick="editorQty(${i},-1)" aria-label="הפחת כמות">−</button>
        <span>×${fmtQty(it.qty)}</span>
        <button onclick="editorQty(${i},1)" aria-label="הגדל כמות">+</button>
      </div>
    </div>`;
  }).join('');
  const suggs = pendingMeal.suggestions.length
    ? `<div class="ed-sugg-title">אולי היה גם?</div><div class="ed-suggs">` +
      pendingMeal.suggestions.map((s,i)=>`<button class="ed-sugg" onclick="editorAddSuggestion(${i})">+ ${esc(s.name)} <span>(${Math.round(s.kcal)})</span></button>`).join('') + `</div>`
    : '';
  box.innerHTML = `
    <div class="result-header"><div class="result-name">${esc(pendingMeal.name)}</div></div>
    ${sourceBadge()}
    <div class="ed-items">${rows || '<div class="empty-state">אין פריטים — הוסף למטה</div>'}</div>
    ${suggs}
    <div class="ed-add-row">
      <input type="text" id="ed-add-input" placeholder="הוסף פריט (למשל: כף טחינה)">
      <button class="btn-small" id="ed-add-btn" onclick="editorAddCustom()">הוסף</button>
    </div>
    <div class="ed-total">
      <div class="ed-total-kcal">${Math.round(t.kcal)} <span>קל'</span></div>
      <div class="ed-total-macros">חלבון ${Math.round(t.protein)}g · פחמ' ${Math.round(t.carbs)}g · שומן ${Math.round(t.fat)}g<br><span>סיבים ${Math.round(t.fiber)}g · סוכר ${Math.round(t.sugar)}g · נתרן ${Math.round(t.sodium)}mg</span></div>
    </div>
    ${pendingMeal.note ? `<div class="result-note">${esc(pendingMeal.note)}</div>` : ''}
    <div class="result-actions">
      <button class="btn-primary" onclick="addMeal()">הוסף ליום ✓</button>
      <button class="btn-ghost" onclick="addMealAndFavorite()">הוסף ושמור כמועדף</button>
      <button class="btn-ghost" onclick="cancelFood()">בטל</button>
    </div>`;
}

function editorQty(i, dir) {
  const it = pendingMeal.items[i]; if (!it) return;
  const step = 0.25;
  it.qty = Math.max(step, Math.round((it.qty + dir*step)*100)/100);
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
  it.name = (g('edit-name').value || 'פריט').trim();
  it.amount = num(g('edit-amount').value);
  it.unit = g('edit-unit').value.trim();
  it.kcal = num(g('edit-kcal').value);
  it.protein = num(g('edit-protein').value);
  it.carbs = num(g('edit-carbs').value);
  it.fat = num(g('edit-fat').value);
  it.fiber = num(g('edit-fiber').value);
  it.sugar = num(g('edit-sugar').value);
  it.sodium = num(g('edit-sodium').value);
  editingItemIdx = null;
  renderEditor();
}

function editorDelete(i) {
  pendingMeal.items.splice(i, 1);
  renderEditor();
}

function editorAddSuggestion(i) {
  const s = pendingMeal.suggestions[i]; if (!s) return;
  pendingMeal.items.push({ ...s, qty: 1 });
  pendingMeal.suggestions.splice(i, 1);
  renderEditor();
}

async function editorAddCustom() {
  const input = document.getElementById('ed-add-input');
  const val = input.value.trim(); if (!val) return;
  const btn = document.getElementById('ed-add-btn');
  btn.disabled = true; btn.textContent = '...';
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: `הערך תזונתית פריט בודד: "${val}". אם לא צוינה כמות הנח כמות טיפוסית. sodium במ"ג, השאר בגרם. החזר JSON בלבד: {"name":"שם","amount":0,"unit":"גרם","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}` }] });
    const it = parseModelJSON(data.content[0].text);
    pendingMeal.items.push(normalizeItem(it));
    renderEditor();
  } catch(e) { alert('שגיאה: ' + e.message); btn.disabled = false; btn.textContent = 'הוסף'; }
}

function buildMealFromEditor() {
  const t = mealTotals();
  const now = new Date();
  return {
    name: pendingMeal.name,
    kcal: Math.round(t.kcal),
    protein: Math.round(t.protein*10)/10, carbs: Math.round(t.carbs*10)/10, fat: Math.round(t.fat*10)/10,
    fiber: Math.round(t.fiber*10)/10, sugar: Math.round(t.sugar*10)/10, sodium: Math.round(t.sodium),
    items: pendingMeal.items.map(it => ({ ...it })),
    time: now.getHours()+':'+String(now.getMinutes()).padStart(2,'0')
  };
}

async function addMeal() {
  if (!pendingMeal || !pendingMeal.items.length) { alert('אין פריטים בארוחה'); return; }
  // שמירה/עדכון מאגר הקבוצה — עם הערכים הסופיים (כולל תיקונים ידניים). חל על כל מסלול ברקוד.
  if (pendingMeal.barcode && pendingMeal.items[0]) {
    saveBarcodeToCache(pendingMeal.barcode, pendingMeal.items[0], pendingMeal.addedByName);
  }
  const finalMeal = buildMealFromEditor();
  todayData.meals.push(finalMeal);
  learnQuickItems(finalMeal);
  pendingMeal = null;
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-input').value = '';
  await saveTodayData();
  await saveProfile();
  await updateStreak();
  renderFoodMeals();
  renderQuickStrip();
  renderHome();
}

async function addMealAndFavorite() {
  if (!pendingMeal || !pendingMeal.items.length) return;
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

// לומד כל פריט בארוחה כאטום לרישום מהיר (ערכים אפקטיביים לאחר qty)
function learnQuickItems(meal) {
  if (!meal || !Array.isArray(meal.items)) return;
  const now = Date.now(), hr = new Date().getHours();
  meal.items.forEach(it => {
    const name = (it.name || '').trim();
    if (!name) return;
    const q = it.qty || 1;
    const eff = {
      amount: r1((it.amount || 0) * q), unit: it.unit || '',
      kcal: Math.round((it.kcal || 0) * q), protein: r1((it.protein || 0) * q), carbs: r1((it.carbs || 0) * q),
      fat: r1((it.fat || 0) * q), fiber: r1((it.fiber || 0) * q), sugar: r1((it.sugar || 0) * q), sodium: Math.round((it.sodium || 0) * q)
    };
    let e = quickItems.find(x => x.name === name);
    if (e) { e.count = (e.count || 0) + 1; e.lastUsed = now; e.lastHour = hr; Object.assign(e, eff); }
    else { quickItems.push({ name, ...eff, count: 1, lastUsed: now, lastHour: hr, pinned: false }); }
  });
  capQuick();
  if (userProfile) userProfile.quickItems = quickItems;
}

function capQuick() {
  if (quickItems.length <= 40) return;
  quickItems.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || (b.count||0)-(a.count||0));
  quickItems = quickItems.slice(0, 40);
}

// ניקוד חכם: תדירות + התאמה לשעה + טריות + נעיצה
function scoreQuick(q) {
  const nowHr = new Date().getHours();
  let s = (q.count || 0) * 3;
  if (q.lastHour != null && Math.abs(q.lastHour - nowHr) <= 2) s += 8;
  if (q.lastUsed) { const days = (Date.now() - q.lastUsed) / 86400000; if (days < 2) s += 4; else if (days < 7) s += 2; }
  if (q.pinned) s += 1000;
  return s;
}

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

async function logQuick(gi, btn) {
  const q = quickItems[gi]; if (!q) return;
  const now = new Date();
  const item = { name:q.name, amount:q.amount, unit:q.unit, kcal:q.kcal, protein:q.protein, carbs:q.carbs, fat:q.fat, fiber:q.fiber, sugar:q.sugar, sodium:q.sodium, qty:1 };
  todayData.meals.push({
    name: q.name, kcal: q.kcal, protein: q.protein, carbs: q.carbs, fat: q.fat, fiber: q.fiber, sugar: q.sugar, sodium: q.sodium,
    items: [item], time: now.getHours()+':'+String(now.getMinutes()).padStart(2,'0')
  });
  q.count = (q.count||0)+1; q.lastUsed = Date.now(); q.lastHour = now.getHours();
  if (userProfile) userProfile.quickItems = quickItems;
  if (btn) { const o = btn.innerHTML; btn.innerHTML = '✓ נוסף'; btn.disabled = true; setTimeout(()=>{ btn.innerHTML = o; btn.disabled = false; }, 1200); }
  await saveTodayData();
  await saveProfile();
  await updateStreak();
  renderFoodMeals();
  renderHome();
}

async function pinQuick(gi) {
  const q = quickItems[gi]; if (!q) return;
  q.pinned = !q.pinned;
  if (userProfile) userProfile.quickItems = quickItems;
  await saveProfile();
  renderQuickStrip();
}

async function removeQuick(gi) {
  quickItems.splice(gi, 1);
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
  try {
    const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role: 'user', content:
      `הערך תזונתית עד 5 פריטים שהמשתמש צורך בקביעות. תשובות המשתמש — משקה בוקר: "${a1}"; ארוחת בוקר: "${a2}"; חטיף נפוץ: "${a3}". פצל לפריטים בודדים הגיוניים (למשל "קפה עם חלב" → פריט אחד). אם לא צוינה כמות הנח כמות טיפוסית. sodium במ"ג, השאר בגרם. החזר JSON בלבד: מערך של {"name":"שם בעברית","amount":0,"unit":"גרם","kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0}` }] });
    const arr = parseModelJSON(data.content[0].text);
    const now = Date.now();
    (Array.isArray(arr) ? arr : []).forEach(it => {
      if (!it || !it.name) return;
      quickItems.push({ name: String(it.name).trim(), amount: r1(it.amount), unit: it.unit||'', kcal: Math.round(+it.kcal||0),
        protein: r1(it.protein), carbs: r1(it.carbs), fat: r1(it.fat), fiber: r1(it.fiber), sugar: r1(it.sugar), sodium: Math.round(+it.sodium||0),
        count: 2, lastUsed: now, lastHour: null, pinned: false });
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
  if (!workoutType) return;
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
    const groupDoc = await db.collection('groups').doc(code).get();
    if (!groupDoc.exists && !(await db.collection('groups').doc(code).collection('members').limit(1).get()).size) {
      alert('קוד לא נמצא. בדוק שוב.'); return;
    }
    await db.collection('groups').doc(code).collection('members').doc(currentUser.uid).set({ joinedAt: firebase.firestore.FieldValue.serverTimestamp() });
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
function calcBMI(weight, height) {
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'תת משקל', color: '#378ADD' };
  if (bmi < 25) return { label: 'תקין', color: '#1D9E75' };
  if (bmi < 30) return { label: 'עודף משקל', color: '#BA7517' };
  return { label: 'השמנה', color: '#E24B4A' };
}

function calcBodyFat(weight, height, age, gender) {
  const bmi = calcBMI(weight, height);
  if (gender === 'male') return Math.round((1.20 * bmi) + (0.23 * age) - 16.2);
  return Math.round((1.20 * bmi) + (0.23 * age) - 5.4);
}

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

// ── COACH SETTINGS ──
function renderCoachSettings() {
  if (!userProfile) return;
  const nameEl = document.getElementById('set-coach-name');
  if (nameEl) nameEl.value = userProfile.coachName || userProfile.name || '';
  const st = userProfile.coachStyle || 'mixed';
  const ch = userProfile.coachChatter || 'balanced';
  document.querySelectorAll('#set-coach-style .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val === st));
  document.querySelectorAll('#set-coach-chatter .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val === ch));
}

async function saveCoachSettings() {
  if (!userProfile) return;
  const nameEl = document.getElementById('set-coach-name');
  if (nameEl) userProfile.coachName = nameEl.value.trim() || userProfile.name;
  await saveProfile();
}

async function setCoachStyle(v) {
  if (!userProfile) return;
  userProfile.coachStyle = v;
  document.querySelectorAll('#set-coach-style .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val === v));
  await saveProfile();
}

async function setCoachChatter(v) {
  if (!userProfile) return;
  userProfile.coachChatter = v;
  document.querySelectorAll('#set-coach-chatter .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val === v));
  await saveProfile();
}

async function testCoachMessage() {
  await saveCoachSettings();
  const out = document.getElementById('coach-test-out');
  if (!out) return;
  out.classList.remove('hidden');
  out.textContent = 'המאמן כותב...';
  try {
    const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
    const msg = await coachMessage(`${coachName()} פתח את מסך ההגדרות. היום צרך ${consumed} קל׳ מתוך ${userProfile.goalKcal}, סטריק ${userProfile.streak||0} ימים. תגיד שלום קצר שמדגים את האופי שלך.`);
    out.textContent = msg || 'לא התקבלה תשובה.';
  } catch(e) { out.textContent = 'שגיאה: ' + e.message; }
}

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

// ── קונפיגורציית קצב (המשתמש בוחר) ──
// step = כמה מעמיקים את הגירעון בכל שבוע מוצלח.
// target = הגירעון/עודף הסופי שאליו זוחלים.
const ADAPT_RATES = {
  gentle:     { label: 'עדין',     step: 100, cutTarget: -250, bulkTarget: 200 },
  balanced:   { label: 'מאוזן',    step: 150, cutTarget: -400, bulkTarget: 300 },
  aggressive: { label: 'אגרסיבי',  step: 200, cutTarget: -500, bulkTarget: 400 }
};
const KCAL_PER_KG = 7700;      // ק"ג משקל גוף בקלוריות
const ADAPT_WINDOW_DAYS = 14;  // חלון מתגלגל
const ADAPT_MIN_DAYS = 7;      // מינימום ימי צריכה מאושרים בחלון
const ADAPT_MIN_WEIGHTS = 3;   // מינימום שקילות
const ADAPT_MIN_SPAN = 10;     // השקילות חייבות להתפרס על לפחות כך ימים
const ADAPT_CADENCE_DAYS = 7;  // כל כמה זמן מציעים עדכון
const ADAPT_MAX_STEP = 250;    // ריכוך: שינוי TDEE מקסימלי לשבוע
const PARTIAL_FRACTION = 0.5;  // יום מתחת ל-50% מהיעד נחשד כרישום חלקי

function adaptRate() {
  const r = (userProfile && userProfile.rate) || 'balanced';
  return ADAPT_RATES[r] ? r : 'balanced';
}
function adaptEnabled() {
  return !userProfile || userProfile.adaptiveEnabled !== false; // ברירת מחדל: פעיל
}

// ── עזר: הפרש ימים בין שני מפתחות תאריך (YYYY-MM-DD) ──
function daysBetween(k1, k2) {
  return Math.round((new Date(k1 + 'T00:00:00') - new Date(k2 + 'T00:00:00')) / 86400000);
}

// ── רגרסיה לינארית (least squares). points: [{x, y}] → שיפוע ──
function linearSlope(points) {
  const n = points.length;
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const p of points) { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return 0;
  return (n * sxy - sx * sy) / denom;
}

// ── סכימת קלוריות ליום בודד ──
function dayKcal(dayData) {
  return (dayData && dayData.meals || []).reduce((s, m) => s + (m.kcal || 0), 0);
}

// ── בונה מפת ימים בחלון (כולל היום מ-todayData) ──
function daysInWindow(history, windowDays) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = dateKey(d);
    const data = (i === 0) ? todayData : (history[key] || null);
    out.push({ key, kcal: dayKcal(data), hasMeals: !!(data && data.meals && data.meals.length) });
  }
  return out; // מהיום אחורה
}

// ── סיווג יום: full / light-confirmed / partial-suspect / empty ──
function classifyDay(day, goalKcal, confirmedLight) {
  if (!day.hasMeals || day.kcal <= 0) return 'empty';
  if (day.kcal >= goalKcal * PARTIAL_FRACTION) return 'full';
  if (confirmedLight && confirmedLight.indexOf(day.key) >= 0) return 'light';
  return 'partial'; // חשוד — נחסום מהחישוב עד שהמשתמש יטפל
}

// ── ימים חשודים כרישום חלקי (לפניית המאמן) ──
function pendingPartialDays() {
  if (!userProfile) return [];
  const history = window._adaptHistoryCache || {};
  const goal = userProfile.goalKcal || 2000;
  const confirmed = userProfile.confirmedLightDays || [];
  const days = daysInWindow(history, ADAPT_WINDOW_DAYS);
  return days.filter(d => classifyDay(d, goal, confirmed) === 'partial');
}

// ══ הליבה: חישוב TDEE אמיתי מהנתונים ══
// מחזיר אובייקט תיאור מלא (בלי לגעת בפרופיל).
function computeAdaptiveTdee(history) {
  const p = userProfile || {};
  const goal = p.goalKcal || 2000;
  const confirmed = p.confirmedLightDays || [];

  // 1) צריכה — רק ימים מאושרים (full / light)
  const days = daysInWindow(history, ADAPT_WINDOW_DAYS);
  const counted = days.filter(d => {
    const c = classifyDay(d, goal, confirmed);
    return c === 'full' || c === 'light';
  });
  const nDays = counted.length;
  const avgIntake = nDays ? Math.round(counted.reduce((s, d) => s + d.kcal, 0) / nDays) : 0;

  // 2) מגמת משקל — רגרסיה על שקילות בחלון
  const wh = (p.weightHistory || []).filter(w => w && w.date && typeof w.weight === 'number');
  const cutoff = dateKey(new Date(Date.now() - ADAPT_WINDOW_DAYS * 86400000));
  const winW = wh.filter(w => w.date >= cutoff);
  const nWeights = winW.length;
  let slopeKgPerDay = 0, spanDays = 0;
  if (nWeights >= 2) {
    const base = winW[0].date;
    const pts = winW.map(w => ({ x: daysBetween(w.date, base), y: w.weight }));
    slopeKgPerDay = linearSlope(pts);
    spanDays = daysBetween(winW[nWeights - 1].date, winW[0].date);
  }

  // 3) בדיקת מספיק נתונים
  const enoughDays = nDays >= ADAPT_MIN_DAYS;
  const enoughWeights = nWeights >= ADAPT_MIN_WEIGHTS && spanDays >= ADAPT_MIN_SPAN;
  const enoughData = enoughDays && enoughWeights;

  // 4) TDEE = צריכה − (שיפוע ק"ג/יום × 7700)
  let tdee = avgIntake - slopeKgPerDay * KCAL_PER_KG;

  // 5) ריכוך מול הערך הקודם (±250)
  const prev = p.adaptiveTdee || p.tdee || null;
  if (prev) tdee = Math.max(prev - ADAPT_MAX_STEP, Math.min(prev + ADAPT_MAX_STEP, tdee));
  tdee = Math.round(Math.max(1200, Math.min(5000, tdee)));

  return {
    enoughData, enoughDays, enoughWeights,
    nDays, nWeights, spanDays, avgIntake,
    slopeKgPerDay, slopeKgPerWeek: slopeKgPerDay * 7,
    tdee,
    need: { days: Math.max(0, ADAPT_MIN_DAYS - nDays), weights: Math.max(0, ADAPT_MIN_WEIGHTS - nWeights) }
  };
}

// ══ ניתוח היקפים ══
// measurementHistory: [{date, waist, arm, chest}] — waist חובה, השאר אופציונלי.
function analyzeMeasurements() {
  const p = userProfile || {};
  const mh = (p.measurementHistory || []).filter(m => m && m.date);
  const cutoff = dateKey(new Date(Date.now() - 28 * 86400000)); // חודש אחורה להיקפים
  const recent = mh.filter(m => m.date >= cutoff);
  function trend(field) {
    const pts = recent.filter(m => typeof m[field] === 'number');
    if (pts.length < 2) return null;
    const base = pts[0].date;
    const slope = linearSlope(pts.map(m => ({ x: daysBetween(m.date, base), y: m[field] })));
    return slope * 7; // ס"מ לשבוע
  }
  return { waist: trend('waist'), arm: trend('arm'), chest: trend('chest'), count: recent.length };
}

// ══ שילוב שלושת האותות → תרחיש + הסבר אנושי ══
// עקרון מפתח: היקפים מנצחים משקל.
function buildWeeklySignals(calc, meas) {
  const goal = userProfile.goal;
  const wkg = userProfile.currentWeight || userProfile.weight || 75;
  const slopePctWeek = (calc.slopeKgPerWeek / wkg) * 100; // אחוז ממשקל הגוף לשבוע

  const waistDown = meas.waist != null && meas.waist < -0.2;
  const waistUp   = meas.waist != null && meas.waist > 0.2;
  const armDown   = meas.arm != null && meas.arm < -0.2;
  const armUp     = meas.arm != null && meas.arm > 0.2;
  const weightDown = calc.slopeKgPerWeek < -0.1;
  const weightUp   = calc.slopeKgPerWeek > 0.1;
  const weightFlat = Math.abs(calc.slopeKgPerWeek) <= 0.1;

  let scenario = 'steady', redFlag = false;
  if (goal === 'cut') {
    if (slopePctWeek < -1.2 && armDown) { scenario = 'losing-muscle'; redFlag = true; }
    else if (waistDown && !armDown)     { scenario = 'clean-cut'; }
    else if (weightFlat && waistDown)   { scenario = 'recomp'; }     // משקל תקוע, מותן יורד = הצלחה
    else if (weightFlat && !waistDown)  { scenario = 'stalled'; }
    else if (weightDown)                { scenario = 'progress'; }
  } else if (goal === 'bulk') {
    if (weightUp && waistUp && !armUp)  { scenario = 'dirty-bulk'; redFlag = true; }
    else if (armUp && !waistUp)         { scenario = 'clean-bulk'; }
    else if (weightFlat)                { scenario = 'stalled-bulk'; }
    else if (weightUp)                  { scenario = 'gaining'; }
  } else { // maintain
    if (Math.abs(slopePctWeek) > 0.8) scenario = 'drift';
    else scenario = 'holding';
  }
  return { scenario, redFlag, slopePctWeek, waistDown, waistUp, armDown, armUp, weightFlat };
}

// ══ חישוב הגירעון הבא (הזחילה ההדרגתית) ══
function computeNextDeficit(signals) {
  const p = userProfile;
  const rate = ADAPT_RATES[adaptRate()];
  const goal = p.goal;
  const target = goal === 'cut' ? rate.cutTarget : goal === 'bulk' ? rate.bulkTarget : 0;
  let cur = (typeof p.currentDeficit === 'number') ? p.currentDeficit : 0;

  if (goal === 'maintain') return 0;

  // דגל אדום → מרככים (מקטינים גירעון / מאטים עודף)
  if (signals.redFlag) {
    if (goal === 'cut')  cur = Math.min(0, cur + 100);   // פחות גירעון
    else                 cur = Math.max(0, cur - 100);   // פחות עודף
    return cur;
  }

  // תקיעות → מעמיקים צעד נוסף לכיוון היעד
  // התקדמות תקינה → זוחלים צעד לכיוון היעד עד שמגיעים אליו
  if (goal === 'cut') {
    cur = Math.max(target, cur - rate.step); // גירעון שלילי, זוחל למטה
  } else {
    cur = Math.min(target, cur + rate.step); // עודף חיובי, זוחל למעלה
  }
  return cur;
}

// ══ בונה הצעת עדכון מלאה (בלי להחיל) ══
function buildAdaptiveProposal(history) {
  const calc = computeAdaptiveTdee(history);
  if (!calc.enoughData) return { ready: false, calc };
  const meas = analyzeMeasurements();
  const signals = buildWeeklySignals(calc, meas);
  const nextDeficit = computeNextDeficit(signals);
  const newGoal = Math.round(Math.max(1200, Math.min(5000, calc.tdee + nextDeficit)));
  const oldGoal = userProfile.goalKcal;
  return {
    ready: true, calc, meas, signals,
    nextDeficit, newGoal, oldGoal,
    delta: newGoal - oldGoal
  };
}

// ── הסבר קצר מקומי (fallback אם אין רשת למאמן) ──
function adaptiveLocalExplain(prop) {
  const s = prop.signals.scenario;
  const map = {
    'clean-cut': 'המשקל יורד, המותן קטֵן והזרוע נשמרת — בדיוק מה שרצינו.',
    'recomp': 'המשקל כמעט לא זז אבל המותן יורד — זה שריר שמחליף שומן. הצלחה.',
    'progress': 'המשקל יורד בקצב יפה. ממשיכים.',
    'stalled': 'המשקל נתקע — הגוף הסתגל, מורידים עוד קצת.',
    'losing-muscle': 'יורד מהר מדי והזרוע קטֵנה — מוסיפים קצת קלוריות ומאטים כדי לשמור על השריר.',
    'clean-bulk': 'הזרוע גדלה והמותן יציב — עלייה נקייה. ממשיכים לבנות.',
    'dirty-bulk': 'המשקל והמותן עולים מהר — מרככים קצת את העודף.',
    'stalled-bulk': 'העלייה נתקעה — מוסיפים עוד קצת דלק.',
    'gaining': 'עולה יפה במשקל. בכיוון.',
    'drift': 'יש סטייה קלה מהמשקל — מיישרים את היעד.',
    'holding': 'שומר יפה על המשקל. מכוונים מדויק.',
    'steady': 'לומד את הקצב שלך ומכייל את היעד.'
  };
  const dir = prop.delta > 0 ? 'מעלה' : prop.delta < 0 ? 'מוריד' : 'משאיר';
  return `${map[s] || map.steady} השבוע אני ${dir} את היעד ל-${prop.newGoal} קל׳. נראה איך המשקל וההיקפים מגיבים ונתקדם.`;
}

// ══════════════════════════════════════════════════════════════════
// ── שכבת UI (דקה) — hooks על פונקציות קיימות ──
// ══════════════════════════════════════════════════════════════════

let _adaptProposal = null; // ההצעה הממתינה לאישור

// נקרא בטעינת האפליקציה
async function runAdaptiveCheck() {
  if (!userProfile || !adaptEnabled()) { renderAdaptiveCard(); renderPartialPrompt(); return; }
  const history = await getHistoryData();
  window._adaptHistoryCache = history; // לשימוש פניית המאמן על ימים חלקיים

  // בדיקת קצב זמן — מציעים רק אם עברו ≥7 ימים
  const last = userProfile.lastTdeeUpdate;
  const dueByTime = !last || daysBetween(getTodayKey(), last) >= ADAPT_CADENCE_DAYS;

  if (dueByTime) {
    const prop = buildAdaptiveProposal(history);
    if (prop.ready && prop.delta !== 0) _adaptProposal = prop;
  }
  renderAdaptiveCard();
  renderPartialPrompt();
}

// כרטיס ההצעה במסך הבית
async function renderAdaptiveCard() {
  const card = document.getElementById('adaptive-card');
  if (!card) return;
  if (!_adaptProposal) { card.classList.add('hidden'); return; }
  const p = _adaptProposal;
  const arrow = p.delta > 0 ? '↑' : '↓';
  const textEl = document.getElementById('adaptive-card-text');
  const metaEl = document.getElementById('adaptive-card-meta');
  if (metaEl) metaEl.textContent =
    `${p.oldGoal.toLocaleString()} → ${p.newGoal.toLocaleString()} קל׳ ${arrow} · TDEE נלמד: ${p.calc.tdee.toLocaleString()} · על סמך ${p.calc.nDays} ימי רישום ו-${p.calc.nWeights} שקילות`;
  if (textEl) {
    textEl.textContent = adaptiveLocalExplain(p); // מיידי
    try { const msg = await coachAdaptiveMessage(p); if (msg) textEl.textContent = msg; } catch(e) {}
  }
  card.classList.remove('hidden');
}

// המאמן מבשר על העדכון בקול/אופי שלו
async function coachAdaptiveMessage(p) {
  const s = p.signals;
  const measTxt = [
    s.waistDown ? 'המותן יורד' : s.waistUp ? 'המותן עולה' : null,
    s.armDown ? 'הזרוע קטֵנה' : s.armUp ? 'הזרוע גדלה' : null
  ].filter(Boolean).join(', ') || 'אין עדיין מספיק היקפים';
  const ctx = `סיכום שבועי של המנוע המסתגל עבור ${coachName()}: מטרה ${GOAL_LABELS[userProfile.goal]}. `
    + `TDEE אמיתי שנלמד מהנתונים: ${p.calc.tdee} קל׳ (ממוצע צריכה ${p.calc.avgIntake}, שינוי משקל ${p.calc.slopeKgPerWeek.toFixed(2)} ק"ג/שבוע). `
    + `היקפים: ${measTxt}. היעד עובר מ-${p.oldGoal} ל-${p.newGoal} קל׳. `
    + `הסבר בקצרה למה השינוי הזה נכון עכשיו, בגובה העיניים, בלי לדקלם מספרים מיותרים. עודד להמשיך.`;
  return await coachMessage(ctx);
}

async function applyAdaptiveUpdate() {
  if (!_adaptProposal || !userProfile) return;
  const p = _adaptProposal;
  userProfile.adaptiveTdee = p.calc.tdee;
  userProfile.goalKcal = p.newGoal;
  userProfile.currentDeficit = p.nextDeficit;
  userProfile.lastTdeeUpdate = getTodayKey();
  if (!Array.isArray(userProfile.tdeeHistory)) userProfile.tdeeHistory = [];
  userProfile.tdeeHistory.push({ date: getTodayKey(), tdee: p.calc.tdee, goalKcal: p.newGoal, deficit: p.nextDeficit });
  await saveProfile();
  _adaptProposal = null;
  renderAdaptiveCard();
  renderHome();
  renderSettings();
  alert('היעד עודכן ל-' + p.newGoal.toLocaleString() + ' קל׳ ✓');
}

async function dismissAdaptiveUpdate() {
  if (!userProfile) return;
  // דוחים לשבוע — מסמנים שבדקנו היום כדי שלא ינדנד שוב מיד
  userProfile.lastTdeeUpdate = getTodayKey();
  await saveProfile();
  _adaptProposal = null;
  renderAdaptiveCard();
}

// ── פניית המאמן על ימים חלקיים ──
function renderPartialPrompt() {
  const el = document.getElementById('partial-prompt');
  if (!el) return;
  const suspects = pendingPartialDays();
  if (!suspects.length) { el.classList.add('hidden'); return; }
  const list = suspects.map(d => {
    const dt = new Date(d.key + 'T00:00:00');
    const label = DAYS_HE[dt.getDay()] + ' ' + dt.getDate() + '/' + (dt.getMonth() + 1);
    return `<div class="partial-row">
      <span>${label} — נרשמו רק ${d.kcal} קל׳</span>
      <span style="display:flex;gap:6px">
        <button class="btn-small" onclick="goToScreen('food')">השלם</button>
        <button class="btn-ghost" style="width:auto;padding:6px 10px;margin:0" onclick="confirmDayLight('${d.key}')">אכלתי קליל</button>
      </span>
    </div>`;
  }).join('');
  const txtEl = document.getElementById('partial-prompt-text');
  if (txtEl) txtEl.textContent = 'ראיתי ימים עם מעט מאוד רישום. עדכן אותי כדי שאדייק לך את היעד:';
  const listEl = document.getElementById('partial-prompt-list');
  if (listEl) listEl.innerHTML = list;
  el.classList.remove('hidden');
}

async function confirmDayLight(key) {
  if (!userProfile) return;
  if (!Array.isArray(userProfile.confirmedLightDays)) userProfile.confirmedLightDays = [];
  if (userProfile.confirmedLightDays.indexOf(key) < 0) userProfile.confirmedLightDays.push(key);
  await saveProfile();
  renderPartialPrompt();
  await runAdaptiveCheck();
}

// ── רישום היקפים ──
async function logMeasurements() {
  if (!userProfile) return;
  const waist = parseFloat(document.getElementById('meas-waist')?.value);
  const arm   = parseFloat(document.getElementById('meas-arm')?.value);
  const chest = parseFloat(document.getElementById('meas-chest')?.value);
  if (!waist || waist < 30 || waist > 200) { alert('הכנס היקף מותן תקין (ס"מ)'); return; }
  const entry = { date: getTodayKey(), waist };
  if (arm && arm > 10 && arm < 80) entry.arm = arm;
  if (chest && chest > 40 && chest < 200) entry.chest = chest;
  if (!Array.isArray(userProfile.measurementHistory)) userProfile.measurementHistory = [];
  // דריסה אם כבר נרשם היום
  userProfile.measurementHistory = userProfile.measurementHistory.filter(m => m.date !== entry.date);
  userProfile.measurementHistory.push(entry);
  ['meas-waist','meas-arm','meas-chest'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  await saveProfile();
  renderMeasurements();
  alert('ההיקפים נשמרו ✓');
}

function renderMeasurements() {
  const el = document.getElementById('measurements-data');
  if (!el || !userProfile) return;
  const mh = userProfile.measurementHistory || [];
  if (!mh.length) { el.innerHTML = '<div class="empty-state">רשום היקף מותן שבועי כדי שהמאמן יוכל לוודא שהחיטוב בריא</div>'; return; }
  const last = mh[mh.length - 1];
  const meas = analyzeMeasurements();
  function trendTxt(v, goodDown) {
    if (v == null) return '';
    const dir = v < -0.05 ? '↓' : v > 0.05 ? '↑' : '=';
    const good = goodDown ? v < 0 : v > 0;
    const col = Math.abs(v) < 0.05 ? 'var(--text-3)' : good ? '#1D9E75' : '#BA7517';
    return `<span style="color:${col};font-size:11px"> ${dir} ${Math.abs(v).toFixed(1)} ס"מ/שבוע</span>`;
  }
  const goalCut = userProfile.goal === 'cut';
  el.innerHTML =
    `<div class="health-row"><span class="health-label">מותן</span><span class="health-val">${last.waist} ס"מ${trendTxt(meas.waist, goalCut)}</span></div>` +
    (last.arm != null ? `<div class="health-row"><span class="health-label">זרוע</span><span class="health-val">${last.arm} ס"מ${trendTxt(meas.arm, false)}</span></div>` : '') +
    (last.chest != null ? `<div class="health-row"><span class="health-label">חזה/ירך</span><span class="health-val">${last.chest} ס"מ${trendTxt(meas.chest, false)}</span></div>` : '');
}

// ── הגדרות: קטע יעד מסתגל ──
function renderAdaptiveSettings() {
  if (!userProfile) return;
  const r = adaptRate();
  document.querySelectorAll('#set-adapt-rate .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val === r));
  const tog = document.getElementById('adapt-toggle');
  if (tog) tog.classList.toggle('on', adaptEnabled());
  const info = document.getElementById('adapt-info');
  if (info) {
    const t = userProfile.adaptiveTdee;
    const last = userProfile.lastTdeeUpdate;
    info.innerHTML =
      `<div class="settings-row"><span>TDEE נלמד</span><span class="settings-val">${t ? t.toLocaleString() + ' קל׳' : 'לומד...'}</span></div>` +
      `<div class="settings-row"><span>עודכן לאחרונה</span><span class="settings-val">${last ? 'לפני ' + daysBetween(getTodayKey(), last) + ' ימים' : '—'}</span></div>`;
  }
}

async function setAdaptiveRate(v) {
  if (!userProfile || !ADAPT_RATES[v]) return;
  userProfile.rate = v;
  document.querySelectorAll('#set-adapt-rate .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.val === v));
  await saveProfile();
  await runAdaptiveCheck();
}

async function toggleAdaptive() {
  if (!userProfile) return;
  userProfile.adaptiveEnabled = !adaptEnabled();
  const tog = document.getElementById('adapt-toggle');
  if (tog) tog.classList.toggle('on', userProfile.adaptiveEnabled);
  await saveProfile();
  await runAdaptiveCheck();
}

// ══ Hooks: עטיפת פונקציות קיימות (הן כבר עברו override קודם — עוטפים את הסופיות) ══
const _s4_showApp = showApp;
showApp = function() {
  _s4_showApp();
  runAdaptiveCheck();
};

const _s4_logWeight = logWeight;
logWeight = async function() {
  await _s4_logWeight();
  await runAdaptiveCheck(); // שקילה חדשה עשויה להפעיל הצעה
};

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

const COACH_DAILY_BUDGET = 3;   // מקסימום טריגרים ביום (בריאותי פורץ)
const COACH_EVENTS_CAP = 200;   // גודל יומן האירועים
const PRIO = { health: 3, opportunity: 2, encouragement: 1 };

// ── תשתית זיכרון: מבטיח שהמבנה קיים (נזרע ריק, ימולא בשלב הבא) ──
function ensureCoachMemory() {
  if (!userProfile) return;
  if (!userProfile.coachMemory) {
    userProfile.coachMemory = { observations: [], preferences: {}, lastUpdated: null };
  }
  if (!Array.isArray(userProfile.coachEvents)) userProfile.coachEvents = [];
}

// ── יומן אירועים: חומר הגלם שממנו שכבת הזיכרון תסיק דפוסים בעתיד ──
async function logCoachEvent(type, meta) {
  if (!userProfile) return;
  ensureCoachMemory();
  userProfile.coachEvents.push({ type, date: getTodayKey(), ts: Date.now(), meta: meta || {} });
  if (userProfile.coachEvents.length > COACH_EVENTS_CAP) {
    userProfile.coachEvents = userProfile.coachEvents.slice(-COACH_EVENTS_CAP);
  }
  await saveProfile();
}

// ── ניסוח קצר של הזיכרון לתוך הוראת המערכת (ריק כרגע → יתמלא בשלב הבא) ──
function coachMemoryPromptFragment() {
  const m = userProfile && userProfile.coachMemory;
  if (!m) return '';
  const parts = [];
  if (Array.isArray(m.observations) && m.observations.length) {
    const obs = m.observations.slice(-8).map(o => (o && o.text) || o).filter(Boolean);
    if (obs.length) parts.push('מה שלמדתי עליו עד כה: ' + obs.join('; ') + '.');
  }
  if (m.preferences && Object.keys(m.preferences).length) {
    const pref = Object.entries(m.preferences).map(([k, v]) => `${k}: ${v}`).join('; ');
    if (pref) parts.push('העדפות שנלמדו: ' + pref + '.');
  }
  return parts.join(' ');
}

// ── תקציב הטון: מעקב יומי (מתאפס בכל יום) ──
function coachDay() {
  ensureCoachMemory();
  const today = getTodayKey();
  if (!userProfile.coachDay || userProfile.coachDay.date !== today) {
    userProfile.coachDay = { date: today, fired: [], count: 0 };
  }
  return userProfile.coachDay;
}
function canFire(type, priority) {
  const cd = coachDay();
  if (cd.fired.indexOf(type) >= 0) return false;          // בלי כפילות באותו יום
  if (priority < PRIO.health && cd.count >= COACH_DAILY_BUDGET) return false; // תקציב מוצה
  return true;
}
async function markFired(type) {
  const cd = coachDay();
  if (cd.fired.indexOf(type) < 0) cd.fired.push(type);
  cd.count++;
  await saveProfile();
}

// ══ הערכת טריגרים — פונקציות תנאי טהורות ══
// כל אחת מחזירה אובייקט טריגר {type, priority, live, kind, data} או null.

function todayConsumed() { return todayData.meals.reduce((s, m) => s + (m.kcal || 0), 0); }
function todayProtein() { return Math.round(todayData.meals.reduce((s, m) => s + (m.protein || 0), 0)); }
function proteinTarget() { return Math.round((userProfile.weight || 75) * 1.8); }

// מאכל חלבוני מהרשימה של המשתמש (אחרת ברירת מחדל)
function proteinFoodHint() {
  const foods = (userProfile && userProfile.foods) || [];
  const rich = ['עוף','ביצים','דג','קוטג\'','יוגורט','בשר','טונה','גבינה','חלבון','שניצל'];
  const hit = foods.find(f => rich.some(r => f.includes(r)));
  return hit || 'ביצה, קוטג׳ או עוף';
}

// 🔴 דגל אדום בריאותי — מהמנוע המסתגל (שלב 4)
function evalRedFlag(history) {
  if (typeof computeAdaptiveTdee !== 'function') return null;
  try {
    const calc = computeAdaptiveTdee(history);
    if (!calc.enoughData) return null;
    const meas = analyzeMeasurements();
    const sig = buildWeeklySignals(calc, meas);
    if (sig.redFlag) return { type: 'redflag', priority: PRIO.health, live: true, data: { sig, calc } };
  } catch (e) {}
  return null;
}

// 🟡 שכחת לאכול — 14:00–19:00 ופחות מ-400 קל׳
function evalForgotToEat() {
  const h = new Date().getHours();
  if (h >= 14 && h < 20 && todayConsumed() < 400) {
    return { type: 'forgot-eat', priority: PRIO.opportunity, live: false, data: { have: todayConsumed() } };
  }
  return null;
}

// 🟡 חלבון נמוך יומיים ברצף
function evalLowProtein(history) {
  const target = proteinTarget();
  const todayP = todayProtein();
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yData = history[dateKey(y)];
  if (!yData) return null;
  const yP = Math.round((yData.meals || []).reduce((s, m) => s + (m.protein || 0), 0));
  if (todayConsumed() > 500 && todayP < target * 0.6 && yP < target * 0.6) {
    return { type: 'low-protein', priority: PRIO.opportunity, live: false, data: { have: todayP, target } };
  }
  return null;
}

// 🟡 לא התאמנת כבר כמה ימים (לפי תדירות היעד)
function evalNoWorkout(history) {
  if (!userProfile.totalWorkouts) return null; // משתמש חדש — לא מנדנדים
  const gap = userProfile.days === '6' ? 2 : userProfile.days === '4' ? 3 : 4;
  const d = new Date();
  let since = 0;
  for (let i = 0; i < 14; i++) {
    const key = dateKey(d);
    const dd = (i === 0) ? todayData : history[key];
    if (dd && (dd.burned || 0) > 0) break;
    since++; d.setDate(d.getDate() - 1);
  }
  if (since > gap) return { type: 'no-workout', priority: PRIO.opportunity, live: false, data: { since } };
  return null;
}

// 🟡 קרוב מאוד ליעד בערב
function evalCloseToGoal() {
  const h = new Date().getHours();
  const remain = userProfile.goalKcal - todayConsumed();
  if (h >= 19 && remain >= 100 && remain <= 300) {
    return { type: 'close-goal', priority: PRIO.opportunity, live: false, data: { remain } };
  }
  return null;
}

// 🟢 אבן דרך בסטריק
function evalStreakMilestone() {
  const s = userProfile.streak || 0;
  if ([7, 14, 30, 60, 100].indexOf(s) >= 0) {
    return { type: 'streak-' + s, priority: PRIO.encouragement, live: s >= 30, data: { streak: s } };
  }
  return null;
}

// ── טקסט מקומי לכל טריגר (חינם) ──
function triggerLocalText(t) {
  const n = coachName();
  const warm = coachChatter() === 'gentle';
  switch (t.type) {
    case 'forgot-eat':
      return warm ? `${n}, עוד לא ראיתי הרבה רישום היום — מה אכלת עד עכשיו? בוא נעדכן.` : `לא שכחת לרשום? עד עכשיו רק ${t.data.have} קל׳. מה אכלת היום?`;
    case 'low-protein':
      return `${n}, יומיים שהחלבון נמוך (${t.data.have}g מתוך ${t.data.target}g). ${proteinFoodHint()} יסגור את הפער יפה.`;
    case 'no-workout':
      return warm ? `${n}, כבר ${t.data.since} ימים בלי אימון — הגוף שלך מוכן, גם 20 דקות זה ניצחון.` : `${t.data.since} ימים בלי אימון. מה דעתך על אימון קצר היום?`;
    case 'close-goal':
      return `${n}, נותרו רק ${t.data.remain} קל׳ ליעד — עוד ארוחה קטנה וסגרת יום מושלם.`;
    default:
      if (t.type.indexOf('streak-') === 0) return `${n}, ${t.data.streak} ימים ברצף! 🔥 אתה במומנטום מעולה.`;
      return '';
  }
}

// ── בקשת טקסט חי מהמאמן לטריגר (רגעים גדולים) ──
async function triggerLiveText(t) {
  let ctx = '';
  if (t.type === 'redflag') {
    ctx = `דגל אדום מהמנוע המסתגל: ${coachName()} יורד במשקל מהר מדי והזרוע מצטמקת — סימן לאובדן שריר. הרגע אותו, הסבר בקצרה שנאט את הקצב ונוסיף קצת קלוריות כדי לשמור על השריר. טון תומך.`;
  } else if (t.type.indexOf('streak-') === 0) {
    ctx = `${coachName()} הגיע ל-${t.data.streak} ימים ברצף באפליקציה. חגוג את זה איתו בחום, משפט קצר.`;
  } else {
    ctx = `אירוע: ${t.type}. תגיב בקצרה בהתאם לאופי.`;
  }
  try { return await coachMessage(ctx); } catch (e) { return triggerLocalText(t); }
}

// ══ הרצת המנוע בכניסה — בוחר טריגר אחד (הכי גבוה בעדיפות) ══
async function runCoachTriggers() {
  if (!userProfile) return;
  ensureCoachMemory();
  const card = document.getElementById('trigger-card');
  if (!card) return;
  const history = await getHistoryData();

  const candidates = [
    evalRedFlag(history),
    evalForgotToEat(),
    evalLowProtein(history),
    evalNoWorkout(history),
    evalCloseToGoal(),
    evalStreakMilestone()
  ].filter(Boolean).filter(t => canFire(t.type, t.priority));

  if (!candidates.length) { card.classList.add('hidden'); return; }
  candidates.sort((a, b) => b.priority - a.priority);
  const t = candidates[0];

  const textEl = document.getElementById('trigger-card-text');
  if (textEl) textEl.textContent = triggerLocalText(t) || '...';
  card.classList.remove('hidden');
  await markFired(t.type);
  await logCoachEvent(t.type, t.data);

  if (t.live && textEl) {
    try { const msg = await triggerLiveText(t); if (msg) textEl.textContent = msg; } catch (e) {}
  }
}

// ── טריגר מיידי אחרי אימון (תגובה ישירה לפעולת המשתמש) ──
async function fireWorkoutTrigger(burn) {
  await logCoachEvent('workout-logged', { burn });
  const card = document.getElementById('trigger-card');
  const textEl = document.getElementById('trigger-card-text');
  if (!card || !textEl) return;
  textEl.textContent = coachLine('workout', { burn: (burn || 0).toLocaleString() });
  card.classList.remove('hidden');
  try {
    const ctx = `${coachName()} בדיוק סיים אימון ושרף ${burn} קל׳ (מטרה: ${GOAL_LABELS[userProfile.goal]}). תן לו קרדיט קצר שמחבר את האימון למטרה שלו.`;
    const msg = await coachMessage(ctx);
    if (msg) textEl.textContent = msg;
  } catch (e) {}
}

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

// buildCoachSystemPrompt → מזריק את הזיכרון (ריק כרגע, יתמלא בשלב הבא)
const _s5_buildCoachSystemPrompt = buildCoachSystemPrompt;
buildCoachSystemPrompt = function() {
  const base = _s5_buildCoachSystemPrompt();
  const mem = coachMemoryPromptFragment();
  return mem ? (base + ' ' + mem) : base;
};

// showApp → מריץ את מנוע הטריגרים בכניסה
const _s5_showApp = showApp;
showApp = function() {
  _s5_showApp();
  runCoachTriggers();
};

// saveWorkout → טריגר מיידי אחרי אימון
const _s5_saveWorkout = saveWorkout;
saveWorkout = async function() {
  const before = todayData.burned || 0;
  await _s5_saveWorkout();
  const burn = (todayData.burned || 0) - before;
  await fireWorkoutTrigger(burn);
};

// renderSettings → מציג את מונה השימוש
const _s5_renderSettings_u = renderSettings;
renderSettings = function() {
  _s5_renderSettings_u();
  renderUsage();
};

// scheduleLocalNotifications → גרסה מודעת-תקציב (מחליפה את הקודמת)
// התראות מתוזמנות מכבדות את אותו תקציב טון ואי-כפילות כמו הכרטיסים.
scheduleLocalNotifications = function() {
  if (Notification.permission !== 'granted' || !userProfile) return;
  const now = new Date();
  const hour = now.getHours();

  async function push(type, priority, title, body) {
    if (!canFire(type, priority)) return;
    sendLocalNotification(title, body);
    await markFired(type);
    await logCoachEvent(type, { via: 'notification' });
  }

  // בוקר (עידוד)
  if (hour < 7) scheduleAt(7, 0, () => push('morning', PRIO.encouragement, 'בוקר טוב ' + coachName() + ' ☀️', coachLine('morning', { goal: userProfile.goalKcal })));

  // שכחת לאכול (הזדמנות)
  if (hour < 14) scheduleAt(14, 0, () => {
    if (todayConsumed() < 400) push('forgot-eat', PRIO.opportunity, '🍽️ לא שכחת לאכול?', triggerLocalText({ type: 'forgot-eat', data: { have: todayConsumed() } }));
  });

  // חלבון (הזדמנות)
  if (hour < 17) scheduleAt(17, 0, () => {
    const p = todayProtein(), tgt = proteinTarget();
    if (p < tgt * 0.6) push('protein', PRIO.opportunity, '📊 בדיקת תזונה', coachLine('protein', { have: p, target: tgt }));
  });

  // ערב — קרוב ליעד (הזדמנות)
  if (hour < 20) scheduleAt(20, 0, () => {
    const remain = userProfile.goalKcal - todayConsumed();
    if (remain >= 100 && remain <= 300) push('close-goal', PRIO.opportunity, '⚡ ' + coachName(), triggerLocalText({ type: 'close-goal', data: { remain } }));
    else if (remain > 300) push('evening', PRIO.opportunity, '⚡ ' + coachName(), coachLine('evening', { remain }));
  });

  // הגנת סטריק (בריאותי-רך — פורץ תקציב כי חשוב)
  if (hour < 21) scheduleAt(21, 0, () => {
    if (todayConsumed() < 100 && (userProfile.streak || 0) > 2) push('streak-guard', PRIO.health, '🔥 הסטריק שלך', coachLine('streak', { streak: userProfile.streak }));
  });
};

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
        const doc = await db.collection('users').doc(currentUser.uid).collection('days').doc(key).get();
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
    await _loadUserData();
    currentDayKey = getTodayKey();
    realTodayData = todayData;
    realWaterCount = waterCount;
  };
})();


// ══════════════════════════════════════════════════════════════════
// ── STAGE 6 / TASK-002 (v2.15.0): מנוע הרגלים (Habit Engine) ──
// אחריות בלעדית: זיהוי, תחזוקה ועדכון של הרגלי משתמש.
// לא כולל: המלצות, לוגיקת מאמן, זיהוי דפוסים מורכב, החלטות, יוזמות, UX.
//
// קלט:  אירועים קיימים בלבד — ארוחות (days/{date}.meals), אימונים
//        (days/{date}.burned>0), משקל (weightHistory), היקפים
//        (measurementHistory). בלי מערכת אירועים חדשה.
// פלט:  הרגלים נכתבים לתוך תשתית הזיכרון הקיימת — coachMemory.habits.
//        בלי מערכת זיכרון מקבילה.
//
// עקרון-על: כל ריצה מחשבת מחדש מהמקור (recompute-from-source). לכן עריכה/
// מחיקה של רישומים משתקפת מאליה בריצה הבאה, בלי חשבונאות אירועים מצטברת.
// הרגל מתפתח: הביטחון עולה עם עקביות ויורד בהדרגה בהיעדרות (הפרעה זמנית
// לא מוחקת הרגל). הרגלים לא-פעילים נשמרים ואינם נמחקים.
//
// רץ פעם ביום, ברקע, לא חוסם עלייה. ללא UI (מוסתר לחלוטין).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── קבועים ──
  const HE_VERSION   = 1;
  const WINDOW_DAYS  = 42;   // חלון תצפית: 6 שבועות
  const INERTIA      = 0.6;  // אינרציית ביטחון (ריכוך; הפרעה זמנית ≠ מחיקה)
  const MAX_HABITS   = 60;   // תקרת אחסון (כולל לא-פעילים)

  // ספי מחזור-חיים (ביטחון 0..1 + מספר מופעים)
  const CONF_INACTIVE  = 0.20;
  const CONF_CANDIDATE = 0.30;
  const CONF_CONFIRMED = 0.55;
  const CONF_ACTIVE    = 0.68;
  const OCC_CANDIDATE  = 3;
  const OCC_CONFIRMED  = 5;

  // מרווח צפוי בין מופעים (ימים) — לחישוב "איחור" בהיחלשות/דעיכה
  const INTERVAL_DAILY  = 2;
  const INTERVAL_WEEKLY = 9;

  const WEEKDAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // ── עזרי תאריך טהורים (מפתחות YYYY-MM-DD בזמן מקומי, עקבי עם dateKey הגלובלי) ──
  function toDate(k) { const p = String(k).split('-'); return new Date(+p[0], (+p[1]) - 1, +p[2]); }
  function daysBetween(aKey, bKey) { return Math.round((toDate(bKey) - toDate(aKey)) / 86400000); }
  function shiftKey(key, delta) { const d = toDate(key); d.setDate(d.getDate() + delta); return dateKey(d); }
  function weekIdxOf(startKey, key) { return Math.floor(daysBetween(startKey, key) / 7); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function trailingTrue(series) { let n = 0; for (let i = series.length - 1; i >= 0; i--) { if (series[i]) n++; else break; } return n; }

  // שעת הארוחה כמספר שלם (או null אם חסר/לא תקין)
  function mealHour(m) {
    if (!m || typeof m.time !== 'string') return null;
    const h = parseInt(m.time.split(':')[0], 10);
    return (isNaN(h) || h < 0 || h > 23) ? null : h;
  }
  // שיוך שעה למקטע-יום
  function inPart(h, part) {
    if (part === 'morning') return h >= 5 && h < 11;
    if (part === 'midday')  return h >= 11 && h < 16;
    if (part === 'evening') return h >= 16 && h < 22;
    if (part === 'night')   return h >= 22 || h < 5;
    return false;
  }
  function ratioLabel(r) { return r >= 0.85 ? 'כמעט תמיד' : r >= 0.6 ? 'לרוב' : 'לעיתים'; }

  // מבנה אות (signal) אחיד שכל גלאי מחזיר
  function makeSignal(type, key, description, frequency, occ, expected, streak, srcDates, period) {
    return {
      id: type + ':' + key, type, key, description, frequency,
      occ, expected, streak, period,
      lastDay: srcDates.length ? srcDates[srcDates.length - 1] : null,
      sourceDates: srcDates
    };
  }

  // ── בניית התצפיות מהחלון (מהיסטוריה + מהפרופיל שכבר בזיכרון) ──
  function buildObservations(history, today) {
    const windowStart = shiftKey(today, -(WINDOW_DAYS - 1));
    const days = [];
    Object.keys(history || {}).forEach(key => {
      if (key < windowStart || key > today) return; // השוואת מחרוזות תקינה ל-YYYY-MM-DD
      const d = history[key] || {};
      const meals = Array.isArray(d.meals) ? d.meals : [];
      const hours = meals.map(mealHour).filter(h => h != null);
      days.push({
        key,
        weekday: toDate(key).getDay(),
        weekIdx: weekIdxOf(windowStart, key),
        hasMeal: meals.length > 0,
        hasTimedMeal: hours.length > 0,
        hours,
        workout: (d.burned || 0) > 0
      });
    });
    days.sort((a, b) => (a.key < b.key ? -1 : 1));

    const inWin = k => k && k >= windowStart && k <= today;
    const weightDates = ((userProfile && userProfile.weightHistory) || [])
      .map(w => w && w.date).filter(inWin).sort();
    const measureDates = ((userProfile && userProfile.measurementHistory) || [])
      .map(m => m && m.date).filter(inWin).sort();

    // שבועות "פעילים" = שבוע עם פעילות כלשהי (ארוחה/אימון/שקילה/מדידה).
    // כך חופשה/מחלה (שבוע ללא פעילות) אינם נספרים לרעת ההרגל.
    const activeSet = {};
    days.forEach(d => { if (d.hasMeal || d.workout) activeSet[d.weekIdx] = true; });
    weightDates.forEach(k => { activeSet[weekIdxOf(windowStart, k)] = true; });
    measureDates.forEach(k => { activeSet[weekIdxOf(windowStart, k)] = true; });
    const activeWeeks = Object.keys(activeSet).map(Number).sort((a, b) => a - b);

    return { today, windowStart, days, weightDates, measureDates, activeWeeks };
  }

  // ── גלאי תזונה: מקטעי-יום קבועים + עקביות רישום שבועית ──
  function detectNutrition(obs) {
    const out = [];
    const timedDays = obs.days.filter(d => d.hasTimedMeal);
    const active = timedDays.length;

    if (active >= 5) {
      const parts = [['morning', 'בוקר'], ['midday', 'צהריים'], ['evening', 'ערב'], ['night', 'לילה']];
      parts.forEach(([partKey, name]) => {
        const series = timedDays.map(d => d.hours.some(h => inPart(h, partKey)));
        const occ = series.filter(Boolean).length;
        const ratio = occ / active;
        if (occ >= OCC_CANDIDATE && ratio >= 0.5) {
          const src = timedDays.filter((d, i) => series[i]).map(d => d.key);
          out.push(makeSignal('nutrition', 'meal:' + partKey, 'ארוחת ' + name + ' קבועה',
            ratioLabel(ratio), occ, active, trailingTrue(series), src, 'daily'));
        }
      });
    }

    // עקביות רישום שבועית: שבוע "מתועד היטב" = לפחות ~4/7 מהימים שבו כוללים ארוחה
    const weeks = {};
    obs.days.forEach(d => {
      const w = weeks[d.weekIdx] || (weeks[d.weekIdx] = { idx: d.weekIdx, present: 0, mealDays: 0, lastKey: d.key });
      w.present++; if (d.hasMeal) w.mealDays++;
      if (d.key > w.lastKey) w.lastKey = d.key;
    });
    const ordered = Object.values(weeks).filter(w => w.present >= 3).sort((a, b) => a.idx - b.idx);
    if (ordered.length >= 3) {
      const series = ordered.map(w => (w.mealDays / w.present) >= 0.57);
      const occ = series.filter(Boolean).length;
      if (occ >= OCC_CANDIDATE) {
        const src = ordered.filter((w, i) => series[i]).map(w => w.lastKey);
        out.push(makeSignal('nutrition', 'log-consistency', 'רישום אוכל עקבי',
          occ + '/' + ordered.length + ' שבועות', occ, ordered.length, trailingTrue(series), src, 'weekly'));
      }
    }
    return out;
  }

  // ── גלאי אימונים: הרגל אימון קבוע לפי יום-בשבוע (תומך בשגרות מרובות) ──
  function detectWorkout(obs) {
    const out = [];
    if (obs.activeWeeks.length < 3) return out;
    const startWd = toDate(obs.windowStart).getDay();
    const todayOffset = daysBetween(obs.windowStart, obs.today);
    const dayByKey = {}; obs.days.forEach(d => { dayByKey[d.key] = d; });

    for (let wd = 0; wd < 7; wd++) {
      const series = [], src = [];
      obs.activeWeeks.forEach(wi => {
        const off = wi * 7 + ((wd - startWd + 7) % 7);
        if (off < 0 || off > todayOffset) return; // היום-בשבוע לא נופל בחלון עבור שבוע זה
        const dk = shiftKey(obs.windowStart, off);
        const worked = !!(dayByKey[dk] && dayByKey[dk].workout);
        series.push(worked);
        if (worked) src.push(dk);
      });
      const occ = series.filter(Boolean).length;
      const exp = series.length;
      if (exp >= 3 && occ >= OCC_CANDIDATE && (occ / exp) >= 0.5) {
        out.push(makeSignal('workout', 'weekday:' + wd, 'אימון קבוע ביום ' + WEEKDAY_HE[wd],
          occ + '/' + exp + ' שבועות', occ, exp, trailingTrue(series), src, 'weekly'));
      }
    }
    return out;
  }

  // ── גלאי שקילה: הרגל שקילה שבועי (התנהגות הרישום, לא ערך המשקל) ──
  function detectWeight(obs) {
    return weeklyLogHabit(obs, obs.weightDates, 'weight', 'weigh-in', 'שקילה שבועית קבועה');
  }
  // ── גלאי היקפים: הרגל מדידה שבועי ──
  function detectMeasurement(obs) {
    return weeklyLogHabit(obs, obs.measureDates, 'measurement', 'measure', 'מדידת היקפים קבועה');
  }
  // עזר משותף לשני הגלאים השבועיים לעיל (מונע כפילות לוגיקה)
  function weeklyLogHabit(obs, dates, type, key, description) {
    const out = [];
    if (obs.activeWeeks.length < 3) return out;
    const hitWeeks = new Set(dates.map(k => weekIdxOf(obs.windowStart, k)));
    const lastInWeek = {};
    dates.forEach(k => { const w = weekIdxOf(obs.windowStart, k); if (!lastInWeek[w] || k > lastInWeek[w]) lastInWeek[w] = k; });
    const series = obs.activeWeeks.map(wi => hitWeeks.has(wi));
    const occ = series.filter(Boolean).length;
    const exp = obs.activeWeeks.length;
    if (occ >= OCC_CANDIDATE && (occ / exp) >= 0.5) {
      const src = obs.activeWeeks.filter(wi => hitWeeks.has(wi)).map(wi => lastInWeek[wi]);
      out.push(makeSignal(type, key, description, occ + '/' + exp + ' שבועות', occ, exp, trailingTrue(series), src, 'weekly'));
    }
    return out;
  }

  // ── מחזור-חיים: קביעת סטטוס דטרמיניסטית מביטחון + מופעים + רעננות ──
  // Observed → Candidate → Confirmed → Active → Weakening → Inactive
  function statusOf(conf, occ, daysSince, interval) {
    const late = interval > 0 ? daysSince / interval : 0;
    if (conf < CONF_INACTIVE || late > 4) return 'inactive';
    if (occ < OCC_CANDIDATE || conf < CONF_CANDIDATE) return 'observed';
    if (occ < OCC_CONFIRMED || conf < CONF_CONFIRMED) return 'candidate';
    if (late > 1.5) return 'weakening';        // מבוסס אך מחליק
    if (conf < CONF_ACTIVE) return 'confirmed'; // מוצק אך לא "פעיל" חזק
    return 'active';                            // חזק + בקצב
  }

  // עדכון/יצירה מתוך אות נוכחי
  function upsertFromSignal(prev, sig, todayKey) {
    const rawC = clamp01(sig.expected > 0 ? sig.occ / sig.expected : 0);
    const conf = prev ? round2(prev.confidence * INERTIA + rawC * (1 - INERTIA)) : round2(rawC * 0.5);
    const interval = sig.period === 'weekly' ? INTERVAL_WEEKLY : INTERVAL_DAILY;
    const daysSince = sig.lastDay ? daysBetween(sig.lastDay, todayKey) : 0;
    return {
      id: sig.id, type: sig.type, key: sig.key,
      description: sig.description, frequency: sig.frequency,
      confidence: conf, consistency: round2(rawC), streak: sig.streak,
      status: statusOf(conf, sig.occ, daysSince, interval),
      firstObserved: prev ? prev.firstObserved : (sig.sourceDates[0] || todayKey),
      lastObserved: sig.lastDay || (prev ? prev.lastObserved : todayKey),
      period: sig.period, expectedIntervalDays: interval,
      sourceEvents: { count: sig.occ, window: WINDOW_DAYS, dates: sig.sourceDates.slice(-12) }
    };
  }

  // דעיכה להרגל ששמור אך לא הופיע בריצה הזו (נשמר — לעולם לא נמחק)
  function decayAbsent(prev, todayKey) {
    const conf = round2((prev.confidence || 0) * INERTIA);
    const interval = prev.expectedIntervalDays || (prev.period === 'weekly' ? INTERVAL_WEEKLY : INTERVAL_DAILY);
    const occ = (prev.sourceEvents && prev.sourceEvents.count) || 0;
    const daysSince = prev.lastObserved ? daysBetween(prev.lastObserved, todayKey) : 999;
    return Object.assign({}, prev, {
      confidence: conf,
      consistency: round2((prev.consistency || 0) * INERTIA),
      status: statusOf(conf, occ, daysSince, interval)
    });
  }

  // ── מתזמר: פעם ביום, ברקע, כותב ל-coachMemory.habits ──
  async function runHabitEngine() {
    try {
      if (!currentUser || !userProfile) return;
      ensureCoachMemory();
      const mem = userProfile.coachMemory;
      if (!mem.habitsMeta) mem.habitsMeta = { lastRun: null, version: HE_VERSION };
      if (!Array.isArray(mem.habits)) mem.habits = [];

      const today = getTodayKey();
      if (mem.habitsMeta.lastRun === today) return; // שער: ריצה אחת ביום (עלות אפס בפתיחות נוספות)

      const history = await getHistoryData();
      const obs = buildObservations(history, today);
      const signals = [].concat(
        detectNutrition(obs), detectWorkout(obs), detectWeight(obs), detectMeasurement(obs)
      );

      const byId = {}; signals.forEach(s => { byId[s.id] = s; });
      const prevById = {}; mem.habits.forEach(h => { prevById[h.id] = h; });

      const next = [];
      signals.forEach(s => next.push(upsertFromSignal(prevById[s.id] || null, s, today)));
      mem.habits.forEach(h => { if (!byId[h.id]) next.push(decayAbsent(h, today)); }); // שמירה + דעיכה

      // תקרת אחסון: שומרים את בעלי הביטחון הגבוה (הלא-פעילים נשמרים עד התקרה)
      if (next.length > MAX_HABITS) {
        next.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        next.length = MAX_HABITS;
      }

      mem.habits = next;
      mem.habitsMeta = { lastRun: today, version: HE_VERSION };
      mem.lastUpdated = Date.now();
      await saveProfile();
    } catch (e) {
      console.error('runHabitEngine:', e);
    }
  }
  window.runHabitEngine = runHabitEngine;

  // ── חיבור: showApp → מריץ את מנוע ההרגלים ברקע (לא חוסם עלייה) ──
  const _s6_showApp = showApp;
  showApp = function () {
    _s6_showApp();
    try { Promise.resolve().then(runHabitEngine); } catch (e) { /* לעולם לא שובר עלייה */ }
  };
})();

// ══════════════════════════════════════════════════════════════════
// ── STAGE 7 / TASK-003 (v2.16.0): מנוע הדפוסים (Pattern Engine) ──
// אחריות בלעדית: זיהוי ותחזוקה של דפוסי התנהגות חוזרים. שכבת תצפית בלבד.
// לא כולל: המלצות, קואצ'ינג, יוזמות, החלטות, AI, UI.
//
// קלט:  Raw historical data (days/{date}: meals[time,protein], burned),
//        weightHistory, measurementHistory — מקור עיקרי. פלט Habit Engine —
//        העשרה אופציונלית בלבד (אינו מקור החישוב). מים אינו בשימוש.
// פלט:  coachMemory.patterns + coachMemory.patternsMeta בלבד. בלי מערכת זיכרון מקבילה.
//
// עקרון-על: כל שדה של כל דפוס הוא פונקציה טהורה ודטרמיניסטית של המקור הנוכחי
// (recompute-from-source מלא). אין EMA, אין זיכרון חוצה-ריצות למעט זהות ה-ID.
// דפוס שאיבד תמיכה נשמר כרשומת inactive מאופסת (בלי עדות ישנה), אותו ID, בלי כפילות.
// אותו מקור ⇒ אותה תוצאה בדיוק. החלון מעוגן ל-lastDataDay. fingerprint חוסם כתיבה מיותרת.
// המשקל האפקטיבי (currentWeight→weight→75) נכלל ב-fingerprint וגם בסף החלבון — אותו helper.
// כתיבה מבודדת עם rollback: כשל שמירה מחזיר את המצב המקומי ומונע קידום fingerprint/lastRun.
// רץ פעם אחת אחרי Habit Engine, ברקע, לא חוסם עלייה, ללא UI.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── קבועים (מיושרים ל-TASK-002 לעקביות) ──
  var PE_VERSION    = 1;
  var PE_WINDOW     = 90;   // חלון תצפית: 90 יום (מתגלגל, מעוגן ל-lastDataDay) — דפוסים ארוכי-טווח
  var OCC_CANDIDATE = 3;
  var OCC_CONFIRMED = 5;
  var C_INACTIVE = 0.20, C_CANDIDATE = 0.30, C_CONFIRMED = 0.55, C_ACTIVE = 0.68;
  var PE_INERTIA = 0.6;              // אינרציית מחזור-חיים — הדרגתיות דו-כיוונית
  var MISS_INACTIVE_PERIODS = 3;     // תקופות היעדר-תמיכה רצופות עד inactive
  var CONF_SEED = 0.5;               // ריכוך ביטחון ראשוני (דפוס חדש אינו קופץ ל-active)
  var WEEKDAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // ── עזרים טהורים פרטיים (עותק עצמאי — בלי צימוד למנועים אחרים) ──
  function toDate(k) { var p = String(k).split('-'); return new Date(+p[0], (+p[1]) - 1, +p[2]); }
  function shiftKey(k, delta) { var d = toDate(k); d.setDate(d.getDate() + delta); return dateKey(d); }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 86400000); }
  function weekIdxOf(start, k) { return Math.floor(daysBetween(start, k) / 7); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function round2(x) { return Math.round(x * 100) / 100; }
  function mealHour(m) { if (!m || typeof m.time !== 'string') return null; var h = parseInt(m.time.split(':')[0], 10); return (isNaN(h) || h < 0 || h > 23) ? null : h; }
  function partOf(h) { if (h >= 5 && h < 11) return 'morning'; if (h >= 11 && h < 16) return 'midday'; if (h >= 16 && h < 22) return 'evening'; return 'night'; }
  function partHe(p) { return p === 'morning' ? 'בוקר' : p === 'midday' ? 'צהריים' : p === 'evening' ? 'ערב' : 'לילה'; }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function std(a) { if (a.length < 2) return 0; var m = mean(a); return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / a.length); }
  function hashStr(s) {
    var h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
    for (var i = 0; i < s.length; i++) { var ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  // ISSUE 3/4: מקור יחיד למשקל אפקטיבי — משמש גם לסף החלבון וגם ל-fingerprint
  function effectiveWeight(profile) { return (profile && profile.currentWeight) || (profile && profile.weight) || 75; }

  // ── קטלוג סגור: ולידציה + מטא סטטי לפי ID (לתחזוקת רשומות inactive יציבות) ──
  function isCatalogId(id) {
    if (id === 'time.first_meal_window' || id === 'time.last_meal_window') return true;
    if (/^weekday\.(active|skip)\.[0-6]$/.test(id)) return true;
    if (id === 'sequence.workout_day_high_protein' || id === 'sequence.workout_back_to_back' || id === 'sequence.rest_after_workout' || id === 'sequence.weigh_measure_together') return true;
    if (id === 'frequency.meals_per_day' || id === 'frequency.workouts_per_week') return true;
    return false;
  }
  function periodOf(id) { if (id.indexOf('time.') === 0) return 'daily'; if (id.indexOf('weekday.') === 0) return 'weekly'; if (id.indexOf('sequence.') === 0) return 'sequence'; if (id === 'frequency.meals_per_day') return 'daily'; return 'weekly'; }
  function staticDescription(id) {
    if (id === 'time.first_meal_window') return 'חלון הארוחה הראשונה';
    if (id === 'time.last_meal_window') return 'חלון הארוחה האחרונה';
    var wm = id.match(/^weekday\.(active|skip)\.([0-6])$/);
    if (wm) return 'יום ' + WEEKDAY_HE[+wm[2]] + (wm[1] === 'active' ? ' מתועד בקביעות' : ' מדולג בקביעות');
    if (id === 'sequence.workout_day_high_protein') return 'ביום אימון נוטה חלבון גבוה';
    if (id === 'sequence.workout_back_to_back') return 'אימון נוטה להימשך ביום העוקב';
    if (id === 'sequence.rest_after_workout') return 'אימון נוטה להיות מלווה במנוחה ביום העוקב';
    if (id === 'sequence.weigh_measure_together') return 'שקילה ומדידה נרשמות יחד';
    if (id === 'frequency.meals_per_day') return 'מספר ארוחות ביום';
    if (id === 'frequency.workouts_per_week') return 'מספר אימונים בשבוע';
    return id;
  }
  // ── Lifecycle חוצה-ריצות: previous record משמש ל-Lifecycle Metadata בלבד ──
  // strength/evidenceCount/opportunityCount נגזרים תמיד טריים מהמקור; מהרשומה הקודמת נקראים
  // רק confidence / status / firstSeen / lastSeen / missedPeriods.
  function minDate(a, b) { if (!a) return b || null; if (!b) return a; return a < b ? a : b; }
  function maxDate(a, b) { if (!a) return b || null; if (!b) return a; return a > b ? a : b; }

  // absence מכריע: היעדר מתמשך → inactive; היעדר קצר → weakening תמיד,
  // כך שהפרעה זמנית לעולם אינה מקפיצה דפוס ישירות ל-inactive.
  function statusOf(confidence, evidenceCount, missedPeriods) {
    if (missedPeriods >= MISS_INACTIVE_PERIODS) return 'inactive';
    if (missedPeriods > 0) return 'weakening';
    if (confidence < C_INACTIVE) return 'inactive';
    if (evidenceCount < OCC_CANDIDATE || confidence < C_CANDIDATE) return 'observed';
    if (evidenceCount < OCC_CONFIRMED || confidence < C_CONFIRMED) return 'candidate';
    if (confidence < C_ACTIVE) return 'confirmed';
    return 'active';
  }

  // דפוס נתמך. שדות נגזרי-מקור תמיד טריים; שדות Lifecycle זזים רק בתקופת הערכה חדשה (advance).
  function upsertSupported(prev, sig, advance) {
    var rawSupport = sig.opportunityCount ? (sig.evidenceCount / sig.opportunityCount) * Math.min(1, sig.opportunityCount / OCC_CONFIRMED) : 0;
    var interval = sig.period === 'daily' ? 2 : 9;
    var src = {
      strength: round2(sig.rawStrength), evidenceCount: sig.evidenceCount,
      opportunityCount: sig.opportunityCount, sampleDates: sig.sampleDates.slice(-12), meta: sig.meta
    };
    var confidence, missedPeriods, status, firstSeen, lastSeen;
    if (!prev) {
      // דפוס חדש — נוצר גם ללא תקופת הערכה חדשה, במצב ראשוני שמרני
      confidence = round2(rawSupport * CONF_SEED); missedPeriods = 0;
      firstSeen = sig.firstSupported; lastSeen = sig.lastSupported;
      status = statusOf(confidence, sig.evidenceCount, 0);
    } else if (advance) {
      // תקופת הערכה חדשה → צעד Lifecycle יחיד (התחזקות הדרגתית)
      confidence = round2(prev.confidence * PE_INERTIA + rawSupport * (1 - PE_INERTIA));
      missedPeriods = 0;
      firstSeen = minDate(prev.firstSeen, sig.firstSupported);
      lastSeen = maxDate(prev.lastSeen, sig.lastSupported);
      status = statusOf(confidence, sig.evidenceCount, 0);
    } else {
      // source recompute בלבד — Lifecycle קפוא לחלוטין
      confidence = prev.confidence;
      missedPeriods = prev.missedPeriods || 0;
      status = prev.status;
      firstSeen = prev.firstSeen;
      lastSeen = maxDate(prev.lastSeen, sig.lastSupported); // רק קדימה, לעולם לא אחורה
    }
    return Object.assign({
      id: sig.id, category: sig.category, description: sig.description,
      confidence: confidence, status: status, firstSeen: firstSeen, lastSeen: lastSeen,
      missedPeriods: missedPeriods, period: sig.period, expectedIntervalDays: interval,
      window: PE_WINDOW, patternVersion: PE_VERSION
    }, src);
  }

  // דפוס קיים ללא תמיכה במקור: אינו נמחק. שדות נגזרי-מקור מתאפסים; Lifecycle דועך רק בתקופה חדשה.
  function carryAbsent(prev, advance) {
    var src = { strength: 0, evidenceCount: 0, opportunityCount: 0, sampleDates: [] };
    if (!advance) {
      // source recompute בלבד — confidence/missedPeriods/status/firstSeen/lastSeen ללא שינוי
      return Object.assign({}, prev, src, { window: PE_WINDOW, patternVersion: PE_VERSION });
    }
    var missedPeriods = (prev.missedPeriods || 0) + 1;
    var confidence = round2((prev.confidence || 0) * PE_INERTIA);
    return Object.assign({}, prev, src, {
      confidence: confidence, missedPeriods: missedPeriods,
      status: statusOf(confidence, 0, missedPeriods),
      firstSeen: prev.firstSeen || null, lastSeen: prev.lastSeen || null,
      window: PE_WINDOW, patternVersion: PE_VERSION
    });
  }

  // ── תצפית: חלון מעוגן ל-lastDataDay (לא ל-today הקלנדרי) ──
  function buildObservation(history, profile, todayKey) {
    var keys = Object.keys(history || {}).filter(function (k) { return k <= todayKey; });
    var wAll = ((profile && profile.weightHistory) || []).map(function (w) { return w && w.date; }).filter(function (d) { return d && d <= todayKey; });
    var mAll = ((profile && profile.measurementHistory) || []).map(function (m) { return m && m.date; }).filter(function (d) { return d && d <= todayKey; });
    var dataDays = keys.filter(function (k) { var d = history[k] || {}; return (Array.isArray(d.meals) && d.meals.length > 0) || ((d.burned || 0) > 0); });
    var anchors = dataDays.concat(wAll, mAll);
    if (!anchors.length) return null;
    var lastDataDay = anchors[0]; anchors.forEach(function (k) { if (k > lastDataDay) lastDataDay = k; });
    var windowStart = shiftKey(lastDataDay, -(PE_WINDOW - 1));
    var n = daysBetween(windowStart, lastDataDay);
    var calendar = [];
    for (var i = 0; i <= n; i++) {
      var dk = shiftKey(windowStart, i);
      var d = history[dk] || {};
      var meals = Array.isArray(d.meals) ? d.meals : [];
      var hours = meals.map(mealHour).filter(function (h) { return h != null; });
      calendar.push({
        key: dk, weekday: toDate(dk).getDay(), weekIdx: weekIdxOf(windowStart, dk),
        hasMeal: meals.length > 0, mealCount: meals.length,
        firstHour: hours.length ? Math.min.apply(null, hours) : null,
        lastHour: hours.length ? Math.max.apply(null, hours) : null,
        protein: meals.reduce(function (s, m) { return s + (m.protein || 0); }, 0),
        workout: (d.burned || 0) > 0
      });
    }
    var inWin = function (k) { return k >= windowStart && k <= lastDataDay; };
    var weightDates = wAll.filter(inWin).sort();
    var measureDates = mAll.filter(inWin).sort();
    var activeSet = {};
    calendar.forEach(function (c) { if (c.hasMeal || c.workout) activeSet[c.weekIdx] = true; });
    weightDates.forEach(function (k) { activeSet[weekIdxOf(windowStart, k)] = true; });
    measureDates.forEach(function (k) { activeSet[weekIdxOf(windowStart, k)] = true; });
    var activeWeekSet = {}; Object.keys(activeSet).forEach(function (w) { activeWeekSet[w] = true; });
    return { todayKey: todayKey, lastDataDay: lastDataDay, windowStart: windowStart, calendar: calendar, weightDates: weightDates, measureDates: measureDates, activeWeekSet: activeWeekSet, profile: profile };
  }

  // מבנה אות אחיד + חישוב evidence/opportunity/missedSinceLast
  function finalize(id, category, description, period, supported, opportunities, rawStrength, meta) {
    var supDates = supported.slice().sort();
    var last = supDates.length ? supDates[supDates.length - 1] : null;
    var missedSinceLast = last == null ? 0 : opportunities.filter(function (o) { return !o.supported && o.date > last; }).length;
    return {
      id: id, category: category, description: description, period: period,
      evidenceCount: supDates.length, opportunityCount: opportunities.length,
      firstSupported: supDates.length ? supDates[0] : null, lastSupported: last,
      missedSinceLast: missedSinceLast, rawStrength: clamp01(rawStrength), meta: meta || {}, sampleDates: supDates
    };
  }

  // ── גלאי Time: חלון היום של הארוחה הראשונה/האחרונה (גבולות יום קלנדרי בלבד) ──
  function detectTime(obs) {
    var out = [];
    var timed = obs.calendar.filter(function (c) { return c.firstHour != null; });
    if (timed.length < 5) return out;
    [['first_meal_window', 'firstHour', 'ראשונה'], ['last_meal_window', 'lastHour', 'אחרונה']].forEach(function (t) {
      var key = t[0], field = t[1], he = t[2];
      var counts = {}; timed.forEach(function (c) { var p = partOf(c[field]); counts[p] = (counts[p] || 0) + 1; });
      var modal = null, mx = -1; Object.keys(counts).forEach(function (p) { if (counts[p] > mx) { mx = counts[p]; modal = p; } });
      var opportunities = timed.map(function (c) { return { date: c.key, supported: partOf(c[field]) === modal }; });
      var supported = opportunities.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var ratio = supported.length / timed.length;
      if (supported.length >= OCC_CANDIDATE && ratio >= 0.5) {
        out.push(finalize('time.' + key, 'time', 'ארוחה ' + he + ' קבועה ב' + partHe(modal), 'daily', supported, opportunities, ratio, { part: modal }));
      }
    });
    return out;
  }

  // ── גלאי Weekday: נטייה יציבה של יום-בשבוע להיות מתועד/מדולג (ללא Locale) ──
  function detectWeekday(obs) {
    var out = [];
    for (var wd = 0; wd < 7; wd++) {
      var opp = obs.calendar.filter(function (c) { return c.weekday === wd && obs.activeWeekSet[c.weekIdx]; });
      if (opp.length < OCC_CANDIDATE) continue;
      var mealCount = opp.filter(function (c) { return c.hasMeal; }).length;
      var ratioActive = mealCount / opp.length;
      if (ratioActive >= 0.6) {
        var oppA = opp.map(function (c) { return { date: c.key, supported: c.hasMeal }; });
        var supA = oppA.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
        out.push(finalize('weekday.active.' + wd, 'weekday', 'יום ' + WEEKDAY_HE[wd] + ' מתועד בקביעות', 'weekly', supA, oppA, Math.abs(ratioActive - 0.5) * 2, { weekday: wd, tendency: 'active' }));
      } else if (ratioActive <= 0.4) {
        var oppS = opp.map(function (c) { return { date: c.key, supported: !c.hasMeal }; });
        var supS = oppS.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
        out.push(finalize('weekday.skip.' + wd, 'weekday', 'יום ' + WEEKDAY_HE[wd] + ' מדולג בקביעות', 'weekly', supS, oppS, Math.abs(ratioActive - 0.5) * 2, { weekday: wd, tendency: 'skip' }));
      }
    }
    return out;
  }

  // ── גלאי Sequence: association באותו יום + מעברי יום עוקבים (גרעיניות יום) ──
  function detectSequence(obs) {
    var out = [];
    var cal = obs.calendar;
    var byKey = {}; cal.forEach(function (c) { byKey[c.key] = c; });
    var weight = effectiveWeight(obs.profile);           // ISSUE 4: משקל אפקטיבי (אותו helper כמו ב-fingerprint)
    var highThresh = Math.round(weight * 1.8) * 0.9;

    var woMeal = cal.filter(function (c) { return c.workout && c.hasMeal; });
    var nonWoMeal = cal.filter(function (c) { return !c.workout && c.hasMeal; });
    if (woMeal.length >= OCC_CANDIDATE && nonWoMeal.length >= OCC_CANDIDATE) {
      var oppP = woMeal.map(function (c) { return { date: c.key, supported: c.protein >= highThresh }; });
      var supP = oppP.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condP = supP.length / woMeal.length;
      var baseP = nonWoMeal.filter(function (c) { return c.protein >= highThresh; }).length / nonWoMeal.length;
      if (condP > baseP && supP.length >= 1) {
        var rsP = baseP < 1 ? clamp01((condP - baseP) / (1 - baseP)) : 0;
        out.push(finalize('sequence.workout_day_high_protein', 'sequence', 'ביום אימון נוטה חלבון גבוה', 'sequence', supP, oppP, rsP, { cond: round2(condP), base: round2(baseP) }));
      }
    }

    var woRate = cal.filter(function (c) { return c.workout; }).length / cal.length;
    var pairs = cal.filter(function (c) { return c.workout && byKey[shiftKey(c.key, 1)]; });
    if (pairs.length >= OCC_CANDIDATE) {
      var oppBB = pairs.map(function (c) { return { date: c.key, supported: byKey[shiftKey(c.key, 1)].workout }; });
      var supBB = oppBB.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condBB = supBB.length / pairs.length;
      if (condBB > woRate && supBB.length >= 1) {
        out.push(finalize('sequence.workout_back_to_back', 'sequence', 'אימון נוטה להימשך ביום העוקב', 'sequence', supBB, oppBB, clamp01((condBB - woRate) / ((1 - woRate) || 1)), { cond: round2(condBB), base: round2(woRate) }));
      }
      var restRate = 1 - woRate;
      var oppR = pairs.map(function (c) { return { date: c.key, supported: !byKey[shiftKey(c.key, 1)].workout }; });
      var supR = oppR.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condR = supR.length / pairs.length;
      if (condR > restRate && supR.length >= 1) {
        out.push(finalize('sequence.rest_after_workout', 'sequence', 'אימון נוטה להיות מלווה במנוחה ביום העוקב', 'sequence', supR, oppR, clamp01((condR - restRate) / ((1 - restRate) || 1)), { cond: round2(condR), base: round2(restRate) }));
      }
    }

    if (obs.weightDates.length >= OCC_CANDIDATE) {
      var mset = obs.measureDates;
      var near = function (d) { return mset.some(function (m) { return Math.abs(daysBetween(d, m)) <= 1; }); };
      var oppW = obs.weightDates.map(function (d) { return { date: d, supported: near(d) }; });
      var supW = oppW.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      var condW = supW.length / oppW.length;
      if (condW >= 0.5 && supW.length >= 1) {
        out.push(finalize('sequence.weigh_measure_together', 'sequence', 'שקילה ומדידה נרשמות יחד', 'sequence', supW, oppW, condW, {}));
      }
    }
    return out;
  }

  // ── גלאי Frequency: קצב אופייני ויציב (ארוחות ליום, אימונים לשבוע) ──
  function detectFrequency(obs) {
    var out = [];
    var active = obs.calendar.filter(function (c) { return c.hasMeal; });
    if (active.length >= OCC_CANDIDATE) {
      var counts = active.map(function (c) { return c.mealCount; });
      var m = mean(counts), sd = std(counts);
      var lo = Math.round(m) - 1, hi = Math.round(m) + 1;
      var opp = active.map(function (c) { return { date: c.key, supported: c.mealCount >= lo && c.mealCount <= hi }; });
      var sup = opp.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      out.push(finalize('frequency.meals_per_day', 'frequency', 'בערך ' + Math.round(m) + ' ארוחות ביום, בקביעות', 'daily', sup, opp, m > 0 ? clamp01(1 - sd / m) : 0, { mean: round2(m), std: round2(sd) }));
    }
    var weeks = {};
    obs.calendar.forEach(function (c) { if (!obs.activeWeekSet[c.weekIdx]) return; var w = weeks[c.weekIdx] || (weeks[c.weekIdx] = { cnt: 0, last: c.key }); if (c.workout) w.cnt++; if (c.key > w.last) w.last = c.key; });
    var wk = Object.keys(weeks).map(function (k) { return weeks[k]; });
    if (wk.length >= OCC_CANDIDATE) {
      var counts2 = wk.map(function (w) { return w.cnt; });
      var m2 = mean(counts2), sd2 = std(counts2);
      var lo2 = Math.round(m2) - 1, hi2 = Math.round(m2) + 1;
      var opp2 = wk.map(function (w) { return { date: w.last, supported: w.cnt >= lo2 && w.cnt <= hi2 }; });
      var sup2 = opp2.filter(function (o) { return o.supported; }).map(function (o) { return o.date; });
      out.push(finalize('frequency.workouts_per_week', 'frequency', 'בערך ' + Math.round(m2) + ' אימונים בשבוע, בקביעות', 'weekly', sup2, opp2, m2 > 0 ? clamp01(1 - sd2 / m2) : 0, { mean: round2(m2), std: round2(sd2) }));
    }
    return out;
  }

  // fingerprint דטרמיניסטי של המקור הרלוונטי בחלון (כולל משקל אפקטיבי; מים אינו נכלל)
  function computeFingerprint(obs, profile) {
    if (!obs) return hashStr('empty:' + PE_VERSION);
    var parts = [PE_VERSION, obs.windowStart, obs.lastDataDay, 'WT:' + effectiveWeight(profile)]; // ISSUE 3
    obs.calendar.forEach(function (c) {
      if (!c.hasMeal && !c.workout) return;
      parts.push(c.key + '|' + (c.firstHour == null ? '' : c.firstHour) + ',' + (c.lastHour == null ? '' : c.lastHour) + ',' + c.protein + ',' + c.mealCount + ',' + (c.workout ? 1 : 0));
    });
    parts.push('W:' + obs.weightDates.join(','));
    parts.push('M:' + obs.measureDates.join(','));
    return hashStr(parts.join(';'));
  }

  // recompute: תמונת המקור מחושבת תמיד מחדש; מחזור-החיים מתקדם רק בתקופת הערכה חדשה (advance).
  function computePatterns(history, profile, todayKey, prevPatterns, advance) {
    var obs = buildObservation(history, profile, todayKey);
    var fingerprint = computeFingerprint(obs, profile);
    var prevById = {};
    (prevPatterns || []).forEach(function (p) { if (p && p.id && isCatalogId(p.id)) prevById[p.id] = p; });
    var byId = {};
    if (obs) {
      var signals = [].concat(detectTime(obs), detectWeekday(obs), detectSequence(obs), detectFrequency(obs));
      signals.forEach(function (s) { byId[s.id] = upsertSupported(prevById[s.id] || null, s, advance !== false); });
    }
    Object.keys(prevById).forEach(function (id) { if (!byId[id]) byId[id] = carryAbsent(prevById[id], advance !== false); });
    var patterns = Object.keys(byId).map(function (k) { return byId[k]; });
    return { patterns: patterns, fingerprint: fingerprint, lastDataDay: obs ? obs.lastDataDay : null };
  }

  // ── מתזמר: רץ אחרי Habit Engine; מפריד בין recompute של המקור לבין קידום תקופת הערכה ──
  //
  // ISSUE 10 — הגדרת Evaluation Advancement:
  //   תקופת הערכה חדשה = *יום נתונים חדש במקור*, כלומר obs.lastDataDay התקדם מעבר ל-
  //   patternsMeta.lastAdvanceDataDay. **לא** יום קלנדרי, **לא** פתיחת אפליקציה, **לא** זמן שחלף.
  //   לכן: מקור זהה ⇒ אין reinforcement ואין decay, גם ביום קלנדרי חדש ואחרי חופשה ארוכה.
  //   מספר הפתיחות והימים שחלפו אינם עדות ואינם משפיעים על Lifecycle.
  //
  //   advance=true  → יום נתונים חדש: מותר צעד Lifecycle יחיד (חיזוק/דעיכה).
  //   advance=false → אין יום נתונים חדש: recompute של strength/evidence מהמקור בלבד,
  //                   בלי לגעת ב-confidence/missedPeriods/status (עריכת עבר אינה תקופה חדשה).
  //   שער כתיבה: אין advance וגם אין שינוי fingerprint → no-op מוחלט, בלי כתיבה.
  //   retry לאחר כשל שמירה נשאר אפשרי (fingerprint/lastAdvanceDataDay לא קודמו).
  async function runPatternEngine() {
    try {
      if (!currentUser || !userProfile) return;

      // סדר אחרי Habit Engine — טיפול שגיאה מקומי: כשל אינו מבטל את Pattern Engine
      try { if (typeof runHabitEngine === 'function') await runHabitEngine(); } catch (e) { /* ממשיכים על Raw Data בלבד */ }

      ensureCoachMemory();
      var mem = userProfile.coachMemory;
      if (!Array.isArray(mem.patterns)) mem.patterns = [];
      if (!mem.patternsMeta) mem.patternsMeta = { lastRun: null, version: PE_VERSION, sourceFingerprint: null, lastAdvanceDataDay: null };
      if (mem.patternsMeta.lastAdvanceDataDay === undefined) mem.patternsMeta.lastAdvanceDataDay = null;

      var history = await getHistoryData();
      var today = getTodayKey();

      // probe: תמונת מקור טרייה ללא צעד Lifecycle — משמשת גם לזיהוי no-op לפני כל מוטציה
      var probe = computePatterns(history, userProfile, today, mem.patterns, false);
      var prevAdvanceDay = mem.patternsMeta.lastAdvanceDataDay;
      var advance = !!probe.lastDataDay && (!prevAdvanceDay || probe.lastDataDay > prevAdvanceDay);
      var fpChanged = (mem.patternsMeta.sourceFingerprint !== probe.fingerprint);

      // no-op: אין יום נתונים חדש ואין שינוי מקור → לא נוגעים בכלום
      if (!advance && !fpChanged) return;

      var result = advance ? computePatterns(history, userProfile, today, mem.patterns, true) : probe;

      // ISSUE 2: snapshot לפני מוטציה → כתיבה מבודדת המזהה כשל → rollback בכשל
      var snap = { patterns: mem.patterns, patternsMeta: mem.patternsMeta, lastUpdated: mem.lastUpdated };
      var newMeta = {
        lastRun: today, version: PE_VERSION, sourceFingerprint: result.fingerprint,
        lastAdvanceDataDay: advance ? result.lastDataDay : prevAdvanceDay
      };
      var newUpdated = Date.now();
      mem.patterns = result.patterns;
      mem.patternsMeta = newMeta;
      mem.lastUpdated = newUpdated;
      try {
        // כתיבה מבודדת (merge) של שדות הדפוסים בלבד — לא נוגעת ב-habits/observations/preferences,
        // ואינה משנה את חוזה saveProfile() הגלובלי. זורקת בכשל (בניגוד ל-saveProfile הבולעת).
        await db.collection('users').doc(currentUser.uid).set(
          { coachMemory: { patterns: result.patterns, patternsMeta: newMeta, lastUpdated: newUpdated } },
          { merge: true }
        );
      } catch (persistErr) {
        // rollback מלא: המצב המקומי חוזר; fingerprint/lastAdvanceDataDay אינם מקודמים; retry אפשרי
        mem.patterns = snap.patterns;
        mem.patternsMeta = snap.patternsMeta;
        mem.lastUpdated = snap.lastUpdated;
        console.error('runPatternEngine: persist failed, rolled back', persistErr);
      }
    } catch (e) {
      console.error('runPatternEngine:', e); // לעולם לא זורק החוצה
    }
  }
  window.runPatternEngine = runPatternEngine;

  // ── חיבור: showApp → מריץ אחרי Habit Engine, ברקע, לא חוסם עלייה ──
  var _s7_showApp = showApp;
  showApp = function () {
    _s7_showApp();
    try { Promise.resolve().then(runPatternEngine); } catch (e) { /* לעולם לא שובר עלייה */ }
  };
})();
