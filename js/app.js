// ── GLOBALS ──
const APP_VERSION = '2.5.2';
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
let darkMode = false;
let workoutType = null;
let workoutInt = 'med';
let pendingMeal = null; // { name, note, items:[{name,amount,unit,kcal,protein,carbs,fat,fiber,sugar,sodium,qty}], suggestions:[...] }
let photoMode = 'plate'; // 'plate' = צילום צלחת, 'label' = צילום תווית תזונתית
let pendingBarcode = null; // הברקוד שצילום התווית הבא ישויך אליו במאגר הקבוצה
let obData = { gender: 'male', days: '2', goal: null };
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
  buildWeekChart();
}

// signInWithGoogle מוגדר ב-firebase-config.js (redirect באייפון/PWA, popup בדסקטופ)

async function signOut() {
  if (confirm('להתנתק?')) await auth.signOut();
}

// ── FIRESTORE ──
async function loadUserData() {
  if (!currentUser) return;
  try {
    const profileDoc = await db.collection('users').doc(currentUser.uid).get();
    if (profileDoc.exists) {
      userProfile = profileDoc.data();
      darkMode = userProfile.darkMode || false;
    }
    const todayKey = getTodayKey();
    const todayDoc = await db.collection('users').doc(currentUser.uid).collection('days').doc(todayKey).get();
    if (todayDoc.exists) {
      const d = todayDoc.data();
      todayData = { meals: d.meals || [], burned: d.burned || 0, steps: d.steps || 0 };
      waterCount = d.water || 0;
    } else {
      todayData = { meals: [], burned: 0, steps: 0 };
      waterCount = 0;
    }
    // Load favorites
    const favDoc = await db.collection('users').doc(currentUser.uid).collection('data').doc('favorites').get();
    favoriteMeals = favDoc.exists ? (favDoc.data().meals || []) : [];
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
    await db.collection('users').doc(currentUser.uid).collection('days').doc(getTodayKey()).set({
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
    const snap = await db.collection('users').doc(currentUser.uid).collection('days').orderBy('updatedAt','desc').limit(30).get();
    snap.forEach(doc => { history[doc.id] = doc.data(); });
  } catch(e) {}
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
    sw.showNotification(title, { body, icon: '/fitme/icon192.png', dir: 'rtl', lang: 'he', vibrate: [200,100,200] });
  });
}

function scheduleLocalNotifications() {
  if (Notification.permission !== 'granted' || !userProfile) return;
  const now = new Date();
  const hour = now.getHours();
  const name = userProfile.name;

  // Morning 7:00
  if (hour < 7) scheduleAt(7, 0, () => sendLocalNotification('בוקר טוב ' + name + '! ☀️', 'יום חדש, התחלה חדשה. היעד שלך היום: ' + userProfile.goalKcal + ' קל\''));

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
    if (protein < targetProtein * 0.6) sendLocalNotification('📊 בדיקת תזונה', 'חסר לך חלבון היום! אכלת ' + Math.round(protein) + 'g מתוך ' + targetProtein + 'g. תאכל ביצים, עוף או קוטג\'.');
  });

  // Evening push 20:00
  if (hour < 20) scheduleAt(20, 0, () => {
    const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
    const remain = userProfile.goalKcal - consumed;
    if (remain > 200) sendLocalNotification('⚡ ' + name + ', תספיק!', 'נותרו לך ' + remain + ' קל\' להיום. יש לך עוד שעתיים!');
  });

  // Streak protection 21:00
  if (hour < 21) scheduleAt(21, 0, () => {
    const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
    if (consumed < 100 && (userProfile.streak||0) > 2) sendLocalNotification('🔥 אל תשבור את הסטריק!', 'סטריק של ' + userProfile.streak + ' ימים בסכנה! רשום מה אכלת היום.');
  });
}

function scheduleAt(hour, min, callback) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, min, 0, 0);
  const diff = target - now;
  if (diff > 0) setTimeout(callback, diff);
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
  document.getElementById('ob-' + step).classList.remove('active');
  document.getElementById('ob-' + (step + 1)).classList.add('active');
}

function obBack(step) {
  document.getElementById('ob-' + step).classList.remove('active');
  document.getElementById('ob-' + (step - 1)).classList.add('active');
}

async function finishOnboarding() {
  const foods = [...document.querySelectorAll('.food-tag.selected')].map(t => t.textContent);
  if (!foods.length) { alert('בחר לפחות מאכל אחד'); return; }
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
    stepsGoal: 10000, streak: 0, darkMode: false, groupCode, groupId: null,
    totalWorkouts: 0, perfectWaterDays: 0, perfectNutritionDays: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
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
    const dayData = isToday ? todayData : (history[key]||null);
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
    const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
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
    const meal = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    showMealEditor(meal);
  } catch(e) { alert('שגיאה בחישוב.'); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

function startCamera() { photoMode = 'plate'; document.getElementById('camera-input').click(); }
function startLabelCamera() { photoMode = 'label'; document.getElementById('camera-input').click(); }

const PLATE_PROMPT = `זהה כל פריט מאכל בצלחת בנפרד — כל רכיב בשורה משלו עם הערכת כמות (גרם/יחידות/כפות) וערכים תזונתיים משלו. אל תאחד הכל לשורה אחת.
ב-suggestions כלול 2-4 "קלוריות נסתרות" שהמצלמה לא רואה אבל אופייניות למנה כזו (שמן בבישול/בטיגון, גבינה מגוררת, רוטב, חמאה) — עם ערכים לכמות טיפוסית.
sodium במ"ג, השאר בגרם. אם התמונה לא ברורה ציין זאת ב-note. החזר JSON בלבד במבנה: `;

const LABEL_PROMPT = `בתמונה תווית ערכים תזונתיים של מוצר. קרא את הטבלה בדיוק.
צור פריט אחד: name = שם המוצר (אם מופיע, אחרת "מוצר מהתווית"), amount ו-unit לפי בסיס הטבלה (100 גרם או מנה — ציין ב-note איזה בסיס), והערכים כפי שכתובים בתווית. sodium במ"ג. suggestions = מערך ריק. אם התווית לא קריאה החזר {"error":"לא קריא"}. החזר JSON בלבד במבנה: `;

async function analyzePhoto(input) {
  const file = input.files[0]; if (!file) return;
  input.value = '';
  document.getElementById('food-loading').classList.remove('hidden');
  document.getElementById('food-result').classList.add('hidden');
  const mode = photoMode; photoMode = 'plate';
  const reader = new FileReader();
  reader.onload = async (e) => {
    const b64 = e.target.result.split(',')[1];
    try {
      const data = await callClaude({ model: 'claude-sonnet-4-6', max_tokens: 1200, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: file.type, data: b64 } },{ type: 'text', text: (mode==='label' ? LABEL_PROMPT : PLATE_PROMPT) + ITEMS_JSON_SPEC }] }] });
      const meal = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
      if (meal.error) { alert('לא הצלחתי לקרוא את התווית. נסה לצלם שוב מקרוב, באור טוב.'); return; }
      showMealEditor(meal);
    } catch(e) { alert('שגיאה בניתוח התמונה: ' + e.message); }
    finally { document.getElementById('food-loading').classList.add('hidden'); }
  };
  reader.readAsDataURL(file);
}

async function startBarcode() {
  // Show scanner overlay
  const overlay = document.getElementById('barcode-overlay');
  if (!overlay) { alert('סריקת ברקוד לא זמינה בדפדפן זה.'); return; }
  overlay.classList.remove('hidden');
  document.getElementById('barcode-status').textContent = 'מכוון את המצלמה לברקוד...';

  // Load Quagga if needed
  if (typeof Quagga === 'undefined') {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: document.getElementById('barcode-video'),
      constraints: { facingMode: 'environment', width: { min: 640 }, height: { min: 480 } }
    },
    decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'] },
    locate: true
  }, function(err) {
    if (err) {
      closeBarcode();
      alert('לא ניתן לפתוח מצלמה. אפשר גישה למצלמה בהגדרות הדפדפן.');
      return;
    }
    Quagga.start();
  });

  let detected = false;
  Quagga.onDetected(async function(result) {
    if (detected) return;
    detected = true;
    const code = result.codeResult.code;
    document.getElementById('barcode-status').textContent = 'נמצא ברקוד: ' + code + ' — מחפש מוצר...';
    Quagga.stop();
    await lookupBarcode(code);
  });
}

function closeBarcode() {
  try { Quagga.stop(); } catch(e) {}
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
  return userProfile.groupId || userProfile.groupCode || null;
}

async function lookupBarcodeInCache(code) {
  const groupKey = getSharedBarcodeGroup();
  if (!groupKey) return null;
  try {
    const doc = await db.collection('groupBarcodes').doc(groupKey).collection('products').doc(code).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { console.warn('barcode cache read failed:', e.code || e.message); return null; }
}

async function saveBarcodeToCache(code, item) {
  const groupKey = getSharedBarcodeGroup();
  if (!groupKey || !code || !item) return;
  try {
    await db.collection('groupBarcodes').doc(groupKey).collection('products').doc(code).set({
      barcode: code,
      name: item.name, amount: item.amount, unit: item.unit,
      kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat,
      fiber: item.fiber, sugar: item.sugar, sodium: item.sodium,
      addedByName: userProfile ? userProfile.name : '',
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.warn('barcode cache save failed:', e.code || e.message); }
}

async function lookupBarcode(code) {
  // 1. מאגר הקבוצה — הכי מהיר, ידני, מדויק
  const cached = await lookupBarcodeInCache(code);
  if (cached) {
    closeBarcode();
    const item = {
      name: cached.name, amount: cached.amount, unit: cached.unit,
      kcal: cached.kcal, protein: cached.protein, carbs: cached.carbs, fat: cached.fat,
      fiber: cached.fiber, sugar: cached.sugar, sodium: cached.sodium
    };
    showMealEditor({
      name: cached.name, items: [item], suggestions: [],
      note: 'מהמאגר של הקבוצה' + (cached.addedByName ? ' · הוסף ע"י ' + cached.addedByName : '')
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
    // 3. שמירה מיידית למאגר הקבוצה — מקור אמין, אין סיבה לחכות לאישור המשתמש
    saveBarcodeToCache(code, item);
    closeBarcode();
    showMealEditor({
      name: item.name, items: [item], suggestions: [],
      note: 'מקור: Open Food Facts · ' + (isNaN(servingSize) ? 'לפי 100 גרם — התאם כמות עם +/-' : 'לפי מנה (' + p.serving_size + ')')
    });
  } catch(e) {
    closeBarcode();
    alert('שגיאה בחיפוש המוצר. בדוק חיבור לאינטרנט.');
  }
}

// ── מסך עריכה אחיד (תמונה / ברקוד / הקלדה) ──
function esc(s) { return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

function normalizeItem(it) {
  return { name: it.name||'פריט', amount: num(it.amount), unit: it.unit||'', kcal: num(it.kcal),
    protein: num(it.protein), carbs: num(it.carbs), fat: num(it.fat),
    fiber: num(it.fiber), sugar: num(it.sugar), sodium: num(it.sodium), qty: it.qty || 1 };
}

let editingItemIdx = null;
function showMealEditor(meal) {
  editingItemIdx = null;
  pendingMeal = {
    name: meal.name || 'ארוחה',
    note: meal.note || '',
    items: (meal.items||[]).map(normalizeItem),
    suggestions: (meal.suggestions||[]).map(normalizeItem)
  };
  renderEditor();
  document.getElementById('food-result').classList.remove('hidden');
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
    const it = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
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
  // שמירה למאגר הקבוצה — רק אחרי אישור המשתמש שהמידע מהתווית נכון
  if (pendingBarcode && pendingMeal.items[0]) {
    saveBarcodeToCache(pendingBarcode, pendingMeal.items[0]);
    pendingBarcode = null;
  }
  todayData.meals.push(buildMealFromEditor());
  pendingMeal = null;
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-input').value = '';
  await saveTodayData();
  await updateStreak();
  renderFoodMeals();
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
  sendLocalNotification('אימון נשמר! 💪', 'שרפת '+burn.toLocaleString()+' קלוריות. כל הכבוד!');
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
    const dayData = isToday ? todayData : (history[key]||null);
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
    sendLocalNotification('הישג חדש! '+a.icon, 'השגת: '+a.title);
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
  if (codeEl && userProfile.groupCode) codeEl.textContent = userProfile.groupCode;
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
  const text = 'הצטרף אלי ל-FitMe! קוד הקבוצה שלי: ' + (userProfile?.groupCode || '');
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
    const menu = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
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
  if (gc) gc.textContent = userProfile.groupCode || '--';
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
  if (name==='food') { renderFoodMeals(); renderFavoritesList(); }
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
