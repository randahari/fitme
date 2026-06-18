// ── GLOBALS ──
const GOAL_LABELS = { cut: 'חיטוב 🔥', bulk: 'מסה 💪', maintain: 'שימור ⚖️' };
const DAYS_HE = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];

let currentUser = null;
let userProfile = null;
let todayData = { meals: [], burned: 0, steps: 0 };
let waterCount = 0;
let darkMode = false;
let workoutType = null;
let workoutInt = 'med';
let pendingFood = null;
let obData = { gender: 'male', days: '2', goal: null };

// ── AUTH ──
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData();
    if (userProfile) {
      showApp();
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
  try {
    await auth.signInWithPopup(googleProvider);
  } catch(e) {
    alert('שגיאה בהתחברות. נסה שוב.');
  }
}

async function signOut() {
  if (confirm('להתנתק?')) {
    await auth.signOut();
  }
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
  } catch(e) {
    console.error('loadUserData error:', e);
  }
}

async function saveProfile() {
  if (!currentUser || !userProfile) return;
  try {
    await db.collection('users').doc(currentUser.uid).set(userProfile, { merge: true });
  } catch(e) { console.error('saveProfile error:', e); }
}

async function saveTodayData() {
  if (!currentUser) return;
  try {
    const todayKey = getTodayKey();
    await db.collection('users').doc(currentUser.uid).collection('days').doc(todayKey).set({
      meals: todayData.meals,
      burned: todayData.burned,
      steps: todayData.steps,
      water: waterCount,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.error('saveTodayData error:', e); }
}

async function getHistoryData() {
  if (!currentUser) return {};
  const history = {};
  try {
    const snapshot = await db.collection('users').doc(currentUser.uid).collection('days')
      .orderBy('updatedAt', 'desc').limit(7).get();
    snapshot.forEach(doc => { history[doc.id] = doc.data(); });
  } catch(e) {}
  return history;
}

function getTodayKey() {
  return new Date().toISOString().slice(0,10);
}

function getApiKey() {
  return localStorage.getItem('fitme_api_key') || '';
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
    obData.name = name;
    obData.age = parseInt(age);
  }
  if (step === 2) {
    const w = document.getElementById('ob-weight').value;
    const h = document.getElementById('ob-height').value;
    if (!w || !h) { alert('נא למלא את כל השדות'); return; }
    obData.weight = parseFloat(w);
    obData.height = parseFloat(h);
  }
  if (step === 3) {
    if (!obData.goal) { alert('נא לבחור מטרה'); return; }
  }
  document.getElementById('ob-' + step).classList.remove('active');
  document.getElementById('ob-' + (step + 1)).classList.add('active');
}

function obBack(step) {
  document.getElementById('ob-' + step).classList.remove('active');
  document.getElementById('ob-' + (step - 1)).classList.add('active');
}

async function finishOnboarding() {
  const foods = [...document.querySelectorAll('.food-tag.selected')].map(t => t.textContent);
  if (foods.length === 0) { alert('בחר לפחות מאכל אחד'); return; }

  const bmr = obData.gender === 'male'
    ? 88.36 + (13.4 * obData.weight) + (4.8 * obData.height) - (5.7 * obData.age)
    : 447.6 + (9.2 * obData.weight) + (3.1 * obData.height) - (4.3 * obData.age);
  const activityMult = obData.days === '2' ? 1.375 : obData.days === '4' ? 1.55 : 1.725;
  const tdee = Math.round(bmr * activityMult);
  const goalKcal = obData.goal === 'cut' ? tdee - 400 : obData.goal === 'bulk' ? tdee + 300 : tdee;

  userProfile = {
    name: obData.name,
    age: obData.age,
    gender: obData.gender,
    weight: obData.weight,
    height: obData.height,
    days: obData.days,
    goal: obData.goal,
    foods,
    tdee,
    goalKcal,
    stepsGoal: 10000,
    streak: 0,
    darkMode: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await saveProfile();
  todayData = { meals: [], burned: 0, steps: 0 };
  waterCount = 0;
  showApp();
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

  const consumed = todayData.meals.reduce((s, m) => s + (m.kcal || 0), 0);
  const target = userProfile.goalKcal;
  const pct = Math.min(100, Math.round(consumed / target * 100));
  const remain = Math.max(0, target - consumed);

  document.getElementById('kcal-consumed').textContent = consumed.toLocaleString();
  document.getElementById('kcal-target').textContent = target.toLocaleString();
  document.getElementById('kcal-bar').style.width = pct + '%';
  document.getElementById('kcal-remain').textContent = 'נותרו ' + remain.toLocaleString() + ' קל\'';

  document.getElementById('m-protein').textContent = Math.round(todayData.meals.reduce((s,m)=>s+(m.protein||0),0)) + 'g';
  document.getElementById('m-carbs').textContent = Math.round(todayData.meals.reduce((s,m)=>s+(m.carbs||0),0)) + 'g';
  document.getElementById('m-fat').textContent = Math.round(todayData.meals.reduce((s,m)=>s+(m.fat||0),0)) + 'g';
  document.getElementById('burned-val').textContent = (todayData.burned || 0).toLocaleString();
  document.getElementById('steps-val').textContent = (todayData.steps || 0).toLocaleString();
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
  for (let i = 0; i < 8; i++) {
    const cup = document.createElement('div');
    cup.className = 'water-cup' + (i < waterCount ? ' filled' : '');
    cup.textContent = '💧';
    cup.onclick = async () => {
      waterCount = i + 1;
      buildWater();
      document.getElementById('water-text').textContent = waterCount + ' / 8';
      await saveTodayData();
    };
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
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const isToday = i === 0;
    const dayData = isToday ? todayData : (history[key] || null);
    const kcal = dayData ? (dayData.meals || []).reduce((s,m) => s+(m.kcal||0), 0) : 0;
    const target = userProfile ? userProfile.goalKcal : 2000;
    const pct = target > 0 ? Math.min(100, Math.round(kcal / target * 100)) : 0;
    const metGoal = kcal >= target * 0.85;
    const col = document.createElement('div');
    col.className = 'week-col';
    col.innerHTML = `<div class="week-bar-fill ${isToday ? 'today' : (metGoal && kcal > 0 ? 'goal-met' : '')}" style="height:${Math.max(4, Math.round(pct * 0.5))}px"></div><div class="week-day">${DAYS_HE[d.getDay()]}</div>`;
    el.appendChild(col);
  }
}

// ── WEIGHT ──
async function logWeight() {
  const val = parseFloat(document.getElementById('weight-input').value);
  if (!val || val < 20 || val > 300) { alert('משקל לא תקין'); return; }
  userProfile.currentWeight = val;
  document.getElementById('weight-input').value = '';
  await saveProfile();
  renderHome();
}

// ── FOOD ──
function goToScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'home') renderHome();
  if (name === 'food') renderFoodMeals();
  if (name === 'plan') renderPlan();
  if (name === 'group') renderGroup();
}

async function analyzeFood() {
  const input = document.getElementById('food-input').value.trim();
  if (!input) return;
  await callFoodAI({ type: 'text', content: input });
}

function startCamera() { document.getElementById('camera-input').click(); }

async function analyzePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const b64 = e.target.result.split(',')[1];
    await callFoodAI({ type: 'image', b64, mediaType: file.type });
  };
  reader.readAsDataURL(file);
}

async function startBarcode() {
  alert('סריקת ברקוד זמינה בטלפון לאחר העלאה ל-GitHub Pages.');
}

async function callFoodAI({ type, content, b64, mediaType }) {
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API בהגדרות'); goToScreen('settings'); return; }

  document.getElementById('food-loading').classList.remove('hidden');
  document.getElementById('food-result').classList.add('hidden');

  const clarifyPrompt = type === 'image'
    ? [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
        { type: 'text', text: 'זהה את המאכל בתמונה. אם חסרים פרטים חשובים לחישוב קלוריות מדויק, שאל שאלה קצרה אחת בעברית. אחרת החזר JSON בלבד: {name, kcal, protein, carbs, fat, confidence:"high"/"mid"/"low"}' }
      ]
    : `המשתמש רשם: "${content}". אם חסרים פרטים חשובים (גודל מנה, שיטת בישול, תוספות, כמות), שאל שאלה קצרה אחת בעברית. אחרת החזר JSON בלבד: {"name":"שם בעברית","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high"}. אל תוסיף טקסט נוסף מחוץ ל-JSON.`;

  try {
    const res1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 200, messages: [{ role: 'user', content: clarifyPrompt }] })
    });
    const data1 = await res1.json();
    const reply = data1.content[0].text.trim();
    const isJson = reply.startsWith('{') || reply.includes('"kcal"');

    if (!isJson) {
      document.getElementById('food-loading').classList.add('hidden');
      const answer = prompt(reply);
      if (!answer) return;
      document.getElementById('food-loading').classList.remove('hidden');

      const fullContent = type === 'image'
        ? [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } }, { type: 'text', text: `שאלת: "${reply}". תשובה: "${answer}". החזר JSON בלבד: {"name":"שם בעברית","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high"}` }]
        : `מאכל: "${content}". שאלת: "${reply}". תשובה: "${answer}". החזר JSON בלבד: {"name":"שם בעברית","kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high"}`;

      const res2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: fullContent }] })
      });
      const data2 = await res2.json();
      const food = JSON.parse(data2.content[0].text.replace(/```json|```/g,'').trim());
      showFoodResult(food);
    } else {
      const food = JSON.parse(reply.replace(/```json|```/g,'').trim());
      showFoodResult(food);
    }
  } catch(e) {
    alert('שגיאה בניתוח המאכל. בדוק את מפתח ה-API.');
  } finally {
    document.getElementById('food-loading').classList.add('hidden');
  }
}

function showFoodResult(food) {
  pendingFood = food;
  document.getElementById('result-name').textContent = food.name;
  document.getElementById('r-kcal').textContent = food.kcal;
  document.getElementById('r-protein').textContent = Math.round(food.protein) + 'g';
  document.getElementById('r-carbs').textContent = Math.round(food.carbs) + 'g';
  document.getElementById('r-fat').textContent = Math.round(food.fat) + 'g';
  const cb = document.getElementById('confidence-badge');
  cb.className = 'confidence-badge ' + food.confidence;
  cb.textContent = food.confidence === 'high' ? 'ביטחון גבוה ✓' : food.confidence === 'mid' ? 'ביטחון בינוני ⚠' : 'ביטחון נמוך ✕';
  document.getElementById('food-result').classList.remove('hidden');
}

async function addMeal() {
  if (!pendingFood) return;
  const now = new Date();
  todayData.meals.push({ ...pendingFood, time: now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0') });
  pendingFood = null;
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-input').value = '';
  await saveTodayData();
  await updateStreak();
  renderFoodMeals();
  renderHome();
}

function cancelFood() {
  pendingFood = null;
  document.getElementById('food-result').classList.add('hidden');
  document.getElementById('food-input').value = '';
}

function renderFoodMeals() {
  const list = document.getElementById('food-meals-list');
  if (!todayData.meals.length) { list.innerHTML = '<div class="empty-state">לא נרשמו ארוחות עדיין</div>'; return; }
  list.innerHTML = '<div class="meals-card">' + todayData.meals.map((m, i) =>
    `<div class="meal-row"><div><div class="meal-name">${m.name}</div><div class="meal-time">${m.time}</div></div><div style="display:flex;align-items:center;gap:8px"><div class="meal-kcal">${m.kcal} קל'</div><button onclick="deleteMeal(${i})" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:18px">×</button></div></div>`
  ).join('') + '</div>';
}

async function deleteMeal(idx) {
  todayData.meals.splice(idx, 1);
  await saveTodayData();
  renderFoodMeals();
  renderHome();
}

// ── WORKOUT ──
function selectWorkout(type) {
  document.querySelectorAll('.workout-opt').forEach(o => o.classList.remove('selected'));
  document.getElementById('wo-' + type).classList.add('selected');
  workoutType = type;
  document.getElementById('cardio-extra').classList.toggle('hidden', type !== 'cardio');
  document.getElementById('save-workout-btn').disabled = false;
  updateWorkout();
}

function selectInt(level) {
  workoutInt = level;
  document.querySelectorAll('.int-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('int-' + level).classList.add('active');
  updateWorkout();
}

function updateCardio() {
  document.getElementById('speed-val').textContent = document.getElementById('speed-slider').value + ' קמ"ש';
  document.getElementById('incline-val').textContent = document.getElementById('incline-slider').value + '%';
  updateWorkout();
}

function updateWorkout() {
  const dur = parseInt(document.getElementById('duration-slider').value);
  document.getElementById('duration-val').textContent = dur + ' דק\'';
  if (!workoutType) { document.getElementById('burn-val').textContent = '--'; return; }
  const intMult = workoutInt === 'easy' ? 0.75 : workoutInt === 'hard' ? 1.35 : 1.0;
  const weight = userProfile ? userProfile.weight : 75;
  let met = 5;
  if (workoutType === 'cardio') {
    const speed = parseFloat(document.getElementById('speed-slider').value);
    const incline = parseInt(document.getElementById('incline-slider').value);
    met = speed < 6 ? 3.5 : speed < 10 ? 7 : speed < 14 ? 10 : 13;
    met += incline * 0.5;
  } else if (workoutType === 'strength') { met = 5.5; }
  else if (workoutType === 'calisthenics') { met = 6; }
  document.getElementById('burn-val').textContent = Math.round(weight * met * intMult * (dur / 60)).toLocaleString();
}

async function logSteps() {
  const val = parseInt(document.getElementById('steps-input').value);
  if (!val || val < 0) { alert('מספר צעדים לא תקין'); return; }
  todayData.steps = val;
  document.getElementById('steps-input').value = '';
  await saveTodayData();
  renderHome();
}

async function saveWorkout() {
  if (!workoutType) return;
  const burn = parseInt(document.getElementById('burn-val').textContent.replace(/,/g,'')) || 0;
  todayData.burned = (todayData.burned || 0) + burn;
  await saveTodayData();
  await updateStreak();
  alert('האימון נשמר! שרפת ' + burn.toLocaleString() + ' קלוריות 💪');
  goToScreen('home');
}

// ── STREAK ──
async function updateStreak() {
  if (!userProfile) return;
  const history = await getHistoryData();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0,10);
    const isToday = i === 0;
    const dayData = isToday ? todayData : (history[key] || null);
    if (!dayData || !dayData.meals || dayData.meals.length === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  userProfile.streak = streak;
  await saveProfile();
  const el = document.getElementById('streak-num');
  if (el) el.textContent = streak;
}

// ── GROUP ──
async function renderGroup() {
  if (!userProfile) return;
  const consumed = todayData.meals.reduce((s,m)=>s+(m.kcal||0),0);
  const members = [
    { name: userProfile.name, kcal: consumed, goal: userProfile.goalKcal, streak: userProfile.streak || 0, isMe: true },
    { name: 'דן', kcal: 1850, goal: 2200, streak: 12, isMe: false },
    { name: 'מיכל', kcal: 1100, goal: 1600, streak: 4, isMe: false },
    { name: 'יוסי', kcal: 2100, goal: 2500, streak: 3, isMe: false },
  ];
  members.sort((a,b) => b.streak - a.streak);
  const colors = ['#EEEDFE|#3C3489','#E1F5EE|#085041','#FAEEDA|#633806','#FAECE7|#712B13'];
  const lb = document.getElementById('leaderboard');
  lb.innerHTML = '<div class="meals-card">' + members.map((m, i) => {
    const c = colors[i % colors.length].split('|');
    return `<div class="leaderboard-row"><div class="lb-rank">${i+1}</div><div class="lb-avatar" style="background:${c[0]};color:${c[1]}">${m.name.slice(0,1)}</div><div style="flex:1"><div class="lb-name">${m.name}${m.isMe?' (את/ה)':''}</div><div class="lb-sub">${m.kcal.toLocaleString()} / ${m.goal.toLocaleString()} קל'</div></div><div class="lb-streak">🔥 ${m.streak}</div></div>`;
  }).join('') + '</div>';
  const met = members.filter(m => m.kcal >= m.goal * 0.85).length;
  const avg = Math.round(members.reduce((s,m)=>s+m.streak,0)/members.length);
  document.getElementById('gs-met').textContent = met + '/' + members.length;
  document.getElementById('gs-streak').textContent = avg;
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
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [{ role: 'user', content: `כתוב סיכום שבועי קצר ומעודד בעברית עבור ${userProfile.name} (מטרה: ${GOAL_LABELS[userProfile.goal]}, יעד: ${userProfile.goalKcal} קל', אכל היום: ${consumed} קל', סטריק: ${userProfile.streak||0} ימים). 2-3 משפטים עם עצה פרקטית אחת.` }] })
    });
    const data = await res.json();
    document.getElementById('weekly-summary').textContent = data.content[0].text;
  } catch(e) { document.getElementById('weekly-summary').textContent = 'שגיאה. נסה שוב.'; }
  finally { document.getElementById('weekly-summary-loading').classList.add('hidden'); }
}

function shareApp() {
  const url = window.location.href;
  if (navigator.share) { navigator.share({ title: 'FitMe', text: 'הצטרף אלי ל-FitMe!', url }); }
  else { navigator.clipboard.writeText(url).then(() => alert('הלינק הועתק!')); }
}

// ── PLAN ──
function renderPlanBanner() {
  const el = document.getElementById('goal-banner');
  if (!el || !userProfile) return;
  const styles = { cut: 'background:var(--coral-light);color:var(--coral-text)', bulk: 'background:var(--teal-light);color:var(--teal-text)', maintain: 'background:var(--amber-light);color:var(--amber-text)' };
  el.setAttribute('style', styles[userProfile.goal] || '');
  el.textContent = 'המטרה שלך: ' + (GOAL_LABELS[userProfile.goal] || '');
}

function renderPlan() {
  renderPlanBanner();
  if (!userProfile) return;
  const p = Math.round(userProfile.weight * (userProfile.goal === 'bulk' ? 2 : userProfile.goal === 'cut' ? 2.2 : 1.8));
  const f = Math.round(userProfile.goalKcal * 0.25 / 9);
  const c = Math.round((userProfile.goalKcal - p*4 - f*9) / 4);
  document.getElementById('plan-targets').innerHTML = `
    <div class="plan-target"><div class="pt-label">קלוריות</div><div class="pt-val">${userProfile.goalKcal.toLocaleString()}</div></div>
    <div class="plan-target"><div class="pt-label">חלבון</div><div class="pt-val">${p}g</div></div>
    <div class="plan-target"><div class="pt-label">פחמימות</div><div class="pt-val">${c}g</div></div>
    <div class="plan-target"><div class="pt-label">שומן</div><div class="pt-val">${f}g</div></div>`;
}

async function generatePlan() {
  const apiKey = getApiKey();
  if (!apiKey) { alert('נא להוסיף מפתח API'); goToScreen('settings'); return; }
  document.getElementById('plan-loading').classList.remove('hidden');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: `צור תפריט שבועי בעברית: מטרה=${GOAL_LABELS[userProfile.goal]}, קלוריות=${userProfile.goalKcal}, מאכלים אהובים=${userProfile.foods.join(', ')}. החזר JSON בלבד: מערך 7 אובייקטים: {day:"יום א'",breakfast:"...",lunch:"...",dinner:"...",snack:"..."}` }] })
    });
    const data = await res.json();
    const menu = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    userProfile.weeklyMenu = menu;
    await saveProfile();
    renderWeeklyMenu(menu);
  } catch(e) { alert('שגיאה. נסה שוב.'); }
  finally { document.getElementById('plan-loading').classList.add('hidden'); }
}

function renderWeeklyMenu(menu) {
  document.getElementById('weekly-menu').innerHTML = menu.map(d =>
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
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role: 'user', content: `צור תוכנית אימונים שבועית: מטרה=${GOAL_LABELS[userProfile.goal]}, ימי אימון=${userProfile.days}. החזר JSON בלבד: מערך 7: {day:"יום א'",name:"...",description:"...",isRest:false}` }] })
    });
    const data = await res.json();
    const plan = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    userProfile.workoutPlan = plan;
    await saveProfile();
    renderWorkoutPlan(plan);
  } catch(e) { alert('שגיאה. נסה שוב.'); }
  finally { document.getElementById('plan-loading').classList.add('hidden'); }
}

function renderWorkoutPlan(plan) {
  document.getElementById('workout-plan').innerHTML = plan.map(d =>
    `<div class="workout-day"><div class="wd-day">${d.day}</div><div><div class="wd-name">${d.name}</div><div class="wd-desc">${d.description||''}</div></div><div class="wd-badge ${d.isRest?'rest':'train'}">${d.isRest?'מנוחה':'אימון'}</div></div>`
  ).join('');
}

function switchPlanTab(tab) {
  document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('plan-nutrition').classList.toggle('hidden', tab !== 'nutrition');
  document.getElementById('plan-workout-tab').classList.toggle('hidden', tab !== 'workout');
}

// ── SETTINGS ──
function renderSettings() {
  if (!userProfile) return;
  document.getElementById('profile-avatar').textContent = (userProfile.name||'?').slice(0,2);
  document.getElementById('profile-name').textContent = userProfile.name;
  document.getElementById('profile-sub').textContent = `${userProfile.weight} ק"ג · ${userProfile.height} ס"מ · גיל ${userProfile.age} · ${GOAL_LABELS[userProfile.goal]||''}`;
  document.getElementById('s-kcal').textContent = (userProfile.goalKcal||0).toLocaleString() + ' קל\'';
  const favEl = document.getElementById('fav-foods-display');
  if (favEl && userProfile.foods) favEl.innerHTML = userProfile.foods.map(f => `<span class="fav-tag">${f}</span>`).join('');
  if (darkMode) document.getElementById('dark-toggle').classList.add('on');
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
  document.getElementById('dark-toggle-btn').textContent = darkMode ? '☀️' : '🌙';
  document.querySelectorAll('#dark-toggle').forEach(t => t.classList.toggle('on', darkMode));
  if (userProfile) { userProfile.darkMode = darkMode; await saveProfile(); }
}

async function resetApp() {
  if (confirm('למחוק את כל הנתונים שלך?')) {
    try {
      await db.collection('users').doc(currentUser.uid).delete();
    } catch(e) {}
    userProfile = null;
    todayData = { meals: [], burned: 0, steps: 0 };
    waterCount = 0;
    showOnboarding();
  }
}
