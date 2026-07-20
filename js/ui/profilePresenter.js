// ══════════════════════════════════════════════════════════════════
// FitMe — Profile Presenter (C1-WP10, UI Controllers and Override Consolidation)
// אחריות בלעדית: renderProfile — המימוש הסופי-בזמן-ריצה היחיד, מאחד את שתי
// השכבות שהיו קיימות ב-js/app.js: ההגדרה הבסיסית (async, avatar/health-data/
// stats/achievements) וה-wrap שהוסיף C1-WP7 (renderMeasurements — Adaptive TDEE,
// safely-chained — docs/architecture/C1_WP0_INVENTORY.md §2.1). כולל גם את
// עוזרי הרינדור הפרטיים ששימשו רק אותה: getAvatarSVG/renderWeightChart (קוד מת
// היום גם במקור — לא נקרא משום מקום — נשמר ללא שינוי, בלי הסרה חד-צדדית)/
// renderAchievements. ראה docs/specs/C1_SPEC_v1.0.md §C1-WP10.
// אינו מבצע כתיבה עמידה ואינו מחשב מדדים בעצמו — קורא ל-ProfileMetrics
// (מודול B1/WP1 יציב, קבוע) ישירות, בדיוק כמו שהפסאדות ב-app.js עשו קודם.
// GOAL_LABELS/ACHIEVEMENTS (קבועים גלובליים משותפים עם דומיינים אחרים) ו-
// renderMeasurements/getHistoryData (תלות ב-Adaptive TDEE/Firestore) מוזרקים.
// תלויות: DOM (documentRef), ProfileMetrics.
// חשיפה: window.ProfilePresenter + module.exports.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var ProfileMetrics = (typeof module !== 'undefined' && module.exports)
    ? require('../domain/profileMetrics.js')
    : window.ProfileMetrics;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function getAvatarSVG(bmi, gender) {
    var isMale = gender !== 'female';
    var bodyWidth = bmi < 18.5 ? 28 : bmi < 25 ? 36 : bmi < 30 ? 44 : 52;
    var color = bmi < 18.5 ? '#AFA9EC' : bmi < 25 ? '#534AB7' : bmi < 30 ? '#BA7517' : '#E24B4A';
    return '<svg viewBox="0 0 80 120" width="80" height="120" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="40" cy="20" r="14" fill="' + color + '" opacity="0.9"/>' +
      '<rect x="' + (40 - bodyWidth / 2) + '" y="36" width="' + bodyWidth + '" height="48" rx="' + (bodyWidth / 4) + '" fill="' + color + '" opacity="0.8"/>' +
      '<rect x="' + (40 - bodyWidth / 2 - 8) + '" y="38" width="10" height="36" rx="5" fill="' + color + '" opacity="0.7"/>' +
      '<rect x="' + (40 + bodyWidth / 2 - 2) + '" y="38" width="10" height="36" rx="5" fill="' + color + '" opacity="0.7"/>' +
      '<rect x="' + (40 - bodyWidth / 4 - 4) + '" y="84" width="12" height="32" rx="6" fill="' + color + '" opacity="0.7"/>' +
      '<rect x="' + (40 + bodyWidth / 4 - 8) + '" y="84" width="12" height="32" rx="6" fill="' + color + '" opacity="0.7"/>' +
      '</svg>';
  }

  // המימוש הסופי-בזמן-ריצה היחיד של renderProfile.
  async function renderProfile() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var doc = deps.documentRef;
    var history = await deps.getHistoryData();

    var weight = userProfile.currentWeight || userProfile.weight;
    var height = userProfile.height;
    var age = userProfile.age;
    var gender = userProfile.gender;

    var bmi = ProfileMetrics.calcBMI(weight, height);
    var bmiCat = ProfileMetrics.getBMICategory(bmi);
    var bodyFat = ProfileMetrics.calcBodyFat(weight, height, age, gender);
    var bmr = gender === 'male'
      ? Math.round(88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age))
      : Math.round(447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age));
    var tdee = userProfile.goalKcal;
    var idealWeight = gender === 'male' ? Math.round(22.5 * (height / 100) * (height / 100)) : Math.round(21 * (height / 100) * (height / 100));
    var toGoal = Math.round((weight - idealWeight) * 10) / 10;
    var todayData = deps.getTodayData();
    var totalKcalBurned = Object.values(history).reduce(function (s, d) { return s + (d.burned || 0); }, 0) + (todayData.burned || 0);

    // Avatar
    var avatarEl = doc.getElementById('prof-avatar-svg');
    if (avatarEl) avatarEl.innerHTML = getAvatarSVG(bmi, gender);

    doc.getElementById('prof-name').textContent = userProfile.name;
    doc.getElementById('prof-goal').textContent = deps.goalLabels[userProfile.goal] || '';

    // Health data
    var healthEl = doc.getElementById('health-data');
    if (healthEl) {
      var progressPct = idealWeight > 0 ? Math.min(100, Math.max(0, 100 - Math.abs(toGoal / idealWeight * 100))) : 100;
      healthEl.innerHTML =
        '<div class="health-row"><span class="health-label">משקל נוכחי</span><span class="health-val">' + weight + ' ק"ג</span></div>' +
        '<div class="health-row"><span class="health-label">BMI</span><span class="health-val" style="color:' + bmiCat.color + '">' + bmi + ' — ' + bmiCat.label + '</span></div>' +
        '<div class="health-row"><span class="health-label">% שומן משוער</span><span class="health-val">' + bodyFat + '%</span></div>' +
        '<div class="health-row"><span class="health-label">BMR (מנוחה)</span><span class="health-val">' + bmr.toLocaleString() + ' קל\'</span></div>' +
        '<div class="health-row"><span class="health-label">TDEE (יומי)</span><span class="health-val">' + tdee.toLocaleString() + ' קל\'</span></div>' +
        '<div class="health-row"><span class="health-label">משקל אידיאלי</span><span class="health-val">' + idealWeight + ' ק"ג</span></div>' +
        '<div class="health-row"><span class="health-label">' + (toGoal > 0 ? 'עודף' : 'חסר') + ' ממשקל אידיאלי</span><span class="health-val">' + Math.abs(toGoal) + ' ק"ג</span></div>' +
        '<div style="margin-top:8px">' +
        '<div style="font-size:11px;color:var(--text-3);margin-bottom:4px">התקדמות למשקל יעד</div>' +
        '<div style="height:6px;background:var(--bg-3);border-radius:3px"><div style="height:6px;background:#1D9E75;border-radius:3px;width:' + progressPct + '%"></div></div>' +
        '</div>';
    }

    // Stats
    doc.getElementById('stat-burned').textContent = totalKcalBurned.toLocaleString();
    doc.getElementById('stat-workouts').textContent = userProfile.totalWorkouts || 0;
    doc.getElementById('stat-streak-best').textContent = Math.max(userProfile.streak || 0, userProfile.bestStreak || 0);
    doc.getElementById('stat-streak-cur').textContent = userProfile.streak || 0;

    renderAchievements();

    // C1-WP7 wrap: Adaptive TDEE measurement history section.
    deps.renderMeasurements();
  }

  // קוד מת גם במקור (לא נקרא משום מקום ב-app.js או ב-HTML) — נשמר ללא שינוי,
  // ללא הסרה חד-צדדית (לא אימות התנהגות — רק שימור נאמן של מה שהיה).
  function renderWeightChart(history) {
    var userProfile = deps.getUserProfile();
    var el = deps.documentRef.getElementById('weight-chart');
    if (!el) return;
    var weights = (userProfile && userProfile.weightHistory) || [];
    if (weights.length < 2) { el.innerHTML = '<div class="empty-state">הוסף לפחות 2 מדידות משקל לראות גרף</div>'; return; }
    var vals = weights.slice(-14);
    var min = Math.min.apply(Math, vals.map(function (v) { return v.weight; })) - 1;
    var max = Math.max.apply(Math, vals.map(function (v) { return v.weight; })) + 1;
    var w = 300, h = 80;
    var points = vals.map(function (v, i) {
      var x = (i / (vals.length - 1)) * w;
      var y = h - ((v.weight - min) / (max - min)) * h;
      return x + ',' + y;
    }).join(' ');
    el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:80px"><polyline points="' + points + '" fill="none" stroke="#534AB7" stroke-width="2" stroke-linejoin="round"/>' +
      vals.map(function (v, i) {
        var x = (i / (vals.length - 1)) * w;
        var y = h - ((v.weight - min) / (max - min)) * h;
        return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#534AB7"/>';
      }).join('') + '</svg>';
  }

  function renderAchievements() {
    var userProfile = deps.getUserProfile();
    var el = deps.documentRef.getElementById('achievements-list');
    if (!el || !userProfile) return;
    el.innerHTML = deps.achievements.map(function (a) {
      var earned = userProfile['ach_' + a.id];
      return '<div class="achievement ' + (earned ? 'earned' : 'locked') + '"><div class="ach-icon">' + (earned ? a.icon : '🔒') + '</div><div class="ach-title">' + a.title + '</div></div>';
    }).join('');
  }

  var API = {
    configure: configure,
    renderProfile: renderProfile,
    getAvatarSVG: getAvatarSVG,
    renderWeightChart: renderWeightChart,
    renderAchievements: renderAchievements
  };

  if (typeof window !== 'undefined') { window.ProfilePresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
