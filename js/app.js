// ── GLOBALS ──
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
let pendingFood = null;
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

async function signInWithGoogle() {
  try { await auth.signInWithPopup(googleProvider); }
  catch(e) { alert('שגיאה בהתחברות. נסה שוב.'); }
}

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

function getTodayKey() { return new Date().toISOString().slice(0,10); }
function getApiKey() { return localStorage.getItem('fitme_api_key') || ''; }
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
  for (let i=6; i>=0; i--) {
    const d = new Date(today); d.setDate(today.getDate()-i);
    const key = d.toISOString().slice(0,10);
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
  document.getElementById('nav-'+name).classList.add('active');
  if (name==='home') renderHome();
  if (name==='food') { renderFoodMeals(); renderFavoritesList(); }
  if (name==='plan') renderPlan();
  if (name==='group') renderGroup();
  if (name==='profile') renderProfile();
  if (name==='settings') renderSettings();
}

async function analyzeFood() {
  const input = document.getElementById('food-input').value.trim();
  if (!input) return;
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API בהגדרות'); goToScreen('settings'); return; }
  foodSession = { originalInput: input, answers: [], questions: [], currentQ: 0 };
  document.getElementById('food-loading').classList.remove('hidden');
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-questionnaire').classList.add('hidden');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600, messages: [{ role: 'user', content: `המשתמש רשם: "${input}". צור שאלון קצר לחישוב קלוריות מדויק. החזר JSON בלבד:
{"questions":[{"q":"שאלה בעברית","options":["אפשרות 1","אפשרות 2","אפשרות 3"]}]}
כללים: עד 3 שאלות, שאל על סוג/חלק, שיטת בישול, כמות. תמיד כלול "אחר" בשאלת הסוג. אל תוסיף טקסט נוסף.` }] })
    });
    const data = await res.json();
    const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    foodSession.questions = parsed.questions;
    showNextQuestion();
  } catch(e) { alert('שגיאה. בדוק את מפתח ה-API.'); }
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

async function calculateFoodResult() {
  const apiKey = getApiKey();
  document.getElementById('food-questionnaire').classList.add('hidden');
  document.getElementById('food-loading').classList.remove('hidden');
  const answersText = foodSession.answers.map(a=>`${a.q}: ${a.a}`).join(', ');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user', content: `חשב קלוריות: מאכל: "${foodSession.originalInput}", פרטים: ${answersText}. החזר JSON בלבד: {"name":"שם מלא בעברית","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high","note":"הערה קצרה"}` }] })
    });
    const data = await res.json();
    const food = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    showFoodResult(food);
  } catch(e) { alert('שגיאה בחישוב.'); }
  finally { document.getElementById('food-loading').classList.add('hidden'); }
}

function startCamera() { document.getElementById('camera-input').click(); }

async function analyzePhoto(input) {
  const file = input.files[0]; if (!file) return;
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API'); goToScreen('settings'); return; }
  document.getElementById('food-loading').classList.remove('hidden');
  const reader = new FileReader();
  reader.onload = async (e) => {
    const b64 = e.target.result.split(',')[1];
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: file.type, data: b64 } },{ type: 'text', text: 'זהה מאכל וחשב קלוריות. JSON בלבד: {"name":"שם","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high","note":"הערה"}' }] }] })
      });
      const data = await res.json();
      showFoodResult(JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim()));
    } catch(e) { alert('שגיאה.'); }
    finally { document.getElementById('food-loading').classList.add('hidden'); }
  };
  reader.readAsDataURL(file);
}

async function startBarcode() { alert('סריקת ברקוד זמינה בטלפון.'); }

function showFoodResult(food) {
  pendingFood = food;
  document.getElementById('result-name').textContent = food.name;
  document.getElementById('r-kcal').textContent = food.kcal;
  document.getElementById('r-protein').textContent = Math.round(food.protein)+'g';
  document.getElementById('r-carbs').textContent = Math.round(food.carbs)+'g';
  document.getElementById('r-fat').textContent = Math.round(food.fat)+'g';
  const cb = document.getElementById('confidence-badge');
  cb.className = 'confidence-badge '+(food.confidence||'high');
  cb.textContent = food.confidence==='high'?'ביטחון גבוה ✓':food.confidence==='mid'?'ביטחון בינוני ⚠':'ביטחון נמוך ✕';
  const noteEl = document.getElementById('result-note');
  if (noteEl && food.note) { noteEl.textContent = '💡 '+food.note; noteEl.classList.remove('hidden'); }
  else if (noteEl) noteEl.classList.add('hidden');
  document.getElementById('food-result').classList.remove('hidden');
}

async function addMeal() {
  if (!pendingFood) return;
  const now = new Date();
  const meal = { ...pendingFood, time: now.getHours()+':'+String(now.getMinutes()).padStart(2,'0') };
  todayData.meals.push(meal);
  pendingFood = null;
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-input').value = '';
  await saveTodayData();
  await updateStreak();
  renderFoodMeals();
  renderHome();
}

async function addMealAndFavorite() {
  if (!pendingFood) return;
  await saveFavoriteFromPending();
  await addMeal();
}

async function saveFavoriteFromPending() {
  if (!pendingFood) return;
  const exists = favoriteMeals.find(f => f.name === pendingFood.name);
  if (!exists) {
    favoriteMeals.push({ ...pendingFood, savedAt: new Date().toISOString() });
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
  pendingFood = null;
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
    const key = d.toISOString().slice(0,10);
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
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API'); goToScreen('settings'); return; }
  document.getElementById('weekly-summary-loading').classList.remove('hidden');
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: `כתוב סיכום שבועי מעודד ואישי בעברית עבור ${userProfile.name} (מטרה: ${GOAL_LABELS[userProfile.goal]}, יעד: ${userProfile.goalKcal} קל', היום: ${consumed} קל', סטריק: ${userProfile.streak||0} ימים, אימונים סה"כ: ${userProfile.totalWorkouts||0}). 2-3 משפטים עם מילות עידוד ועצה פרקטית.` }] })
    });
    const data = await res.json();
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
  if (userProfile.workoutPlan) renderWorkoutPlan(userProfile.workoutPlan);
}

async function generatePlan() {
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API'); goToScreen('settings'); return; }
  document.getElementById('plan-loading').classList.remove('hidden');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: `תפריט שבועי: מטרה=${GOAL_LABELS[userProfile.goal]}, קלוריות=${userProfile.goalKcal}, מאכלים=${userProfile.foods.join(',')}. JSON בלבד: מערך 7: {day:"יום א'",breakfast:"",lunch:"",dinner:"",snack:""}` }] })
    });
    const data = await res.json();
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

async function generateWorkoutPlan() {
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API'); goToScreen('settings'); return; }
  document.getElementById('plan-loading').classList.remove('hidden');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role: 'user', content: `תוכנית אימונים שבועית: מטרה=${GOAL_LABELS[userProfile.goal]}, ימים=${userProfile.days}. JSON בלבד: מערך 7: {day:"יום א'",name:"",description:"",isRest:false}` }] })
    });
    const data = await res.json();
    const plan = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    userProfile.workoutPlan = plan;
    await saveProfile();
    renderWorkoutPlan(plan);
  } catch(e) { alert('שגיאה.'); }
  finally { document.getElementById('plan-loading').classList.add('hidden'); }
}

function renderWorkoutPlan(plan) {
  document.getElementById('workout-plan').innerHTML = plan.map(d=>
    `<div class="workout-day"><div class="wd-day">${d.day}</div><div><div class="wd-name">${d.name}</div><div class="wd-desc">${d.description||''}</div></div><div class="wd-badge ${d.isRest?'rest':'train'}">${d.isRest?'מנוחה':'אימון'}</div></div>`
  ).join('');
}

function switchPlanTab(tab) {
  document.querySelectorAll('.plan-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('plan-nutrition').classList.toggle('hidden', tab!=='nutrition');
  document.getElementById('plan-workout-tab').classList.toggle('hidden', tab!=='workout');
}

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
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API'); return; }
  document.getElementById('weekly-letter').textContent = 'Claude כותב...';
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user', content: `כתוב מכתב אישי קצר ומעודד בעברית ל${userProfile.name} לסיום השבוע. נתונים: מטרה=${GOAL_LABELS[userProfile.goal]}, סטריק=${userProfile.streak||0} ימים, אימונים=${userProfile.totalWorkouts||0}, היום=${consumed} קל'. כתוב בגוף ראשון אישי, 3-4 משפטים, עם עידוד אמיתי ועצה לשבוע הבא.` }] })
    });
    const data = await res.json();
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

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) { alert('הכנס מפתח תקין'); return; }
  localStorage.setItem('fitme_api_key', key);
  document.getElementById('api-key-input').value = '';
  alert('מפתח ה-API נשמר ✓');
}

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
