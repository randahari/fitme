// ══════════════════════════════════════════════════════════════════
// FitMe — Settings Presenter (C1-WP10, UI Controllers and Override Consolidation)
// אחריות בלעדית: renderSettings — המימוש הסופי-בזמן-ריצה היחיד. מאחד ארבע
// שכבות safely-chained שהיו קיימות ב-js/app.js (docs/architecture/
// C1_WP0_INVENTORY.md §2.1): ההגדרה הבסיסית (avatar/name/sub/יעד קלוריות/
// מועדפים/מצב-כהה/קוד-קבוצה + renderCoachSettings), wrap1 (יעדי תוכנית +
// תפריט שבועי + תווית גרסה לאבחון), wrap2 (הגדרות Adaptive TDEE), wrap3
// (תצוגת מונה שימוש) — באותו סדר קריאות מדויק. ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP10. renderCoachSettings/renderAdaptiveSettings/renderUsage כבר קיימים
// כמודולים/פונקציות עצמאיות (WP6/WP7/STAGE 5) — מוזרקים כ-closures, אין שכפול
// לוגיקה. GOAL_LABELS/APP_VERSION (קבועים גלובליים משותפים) מוזרקים.
// תלויות: DOM (documentRef) בלבד.
// חשיפה: window.SettingsPresenter + module.exports.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function weeklyMenuHtml(menu) {
    return menu.map(function (d) {
      return '<div class="menu-day"><div class="menu-day-title">' + d.day + '</div><div class="menu-meal"><span class="menu-meal-label">בוקר: </span>' + d.breakfast + '</div><div class="menu-meal"><span class="menu-meal-label">צהריים: </span>' + d.lunch + '</div><div class="menu-meal"><span class="menu-meal-label">ערב: </span>' + d.dinner + '</div><div class="menu-meal"><span class="menu-meal-label">חטיף: </span>' + d.snack + '</div></div>';
    }).join('');
  }

  // המימוש הסופי-בזמן-ריצה היחיד של renderSettings.
  function renderSettings() {
    var userProfile = deps.getUserProfile();
    if (!userProfile) return;
    var doc = deps.documentRef;

    var el = doc.getElementById('profile-avatar');
    if (el) el.textContent = (userProfile.name || '?').slice(0, 2);
    var pn = doc.getElementById('profile-name');
    if (pn) pn.textContent = userProfile.name;
    var ps = doc.getElementById('profile-sub');
    if (ps) ps.textContent = userProfile.weight + ' ק"ג · ' + userProfile.height + ' ס"מ · גיל ' + userProfile.age + ' · ' + (deps.goalLabels[userProfile.goal] || '');
    var sk = doc.getElementById('s-kcal');
    if (sk) sk.textContent = (userProfile.goalKcal || 0).toLocaleString() + ' קל\'';
    var favEl = doc.getElementById('fav-foods-display');
    if (favEl && userProfile.foods) favEl.innerHTML = userProfile.foods.map(function (f) { return '<span class="fav-tag">' + f + '</span>'; }).join('');
    if (deps.getDarkMode()) { var dt = doc.getElementById('dark-toggle'); if (dt) dt.classList.add('on'); }
    var gc = doc.getElementById('settings-group-code');
    if (gc) gc.textContent = userProfile.groupId || '--';
    deps.renderCoachSettings();

    // wrap1: יעדי תוכנית + תפריט שבועי + תווית גרסה
    var p = Math.round(userProfile.weight * (userProfile.goal === 'bulk' ? 2 : userProfile.goal === 'cut' ? 2.2 : 1.8));
    var f = Math.round(userProfile.goalKcal * 0.25 / 9);
    var c = Math.round((userProfile.goalKcal - p * 4 - f * 9) / 4);
    var ptEl = doc.getElementById('plan-targets-settings');
    if (ptEl) ptEl.innerHTML = '<div class="stats-row"><div class="stat-item"><div class="stat-v">' + userProfile.goalKcal + '</div><div class="stat-l">קל׳</div></div><div class="stat-item"><div class="stat-v">' + p + 'g</div><div class="stat-l">חלבון</div></div><div class="stat-item"><div class="stat-v">' + c + 'g</div><div class="stat-l">פחמ׳</div></div><div class="stat-item"><div class="stat-v">' + f + 'g</div><div class="stat-l">שומן</div></div></div>';
    if (userProfile.weeklyMenu) {
      var wm = doc.getElementById('weekly-menu-settings');
      if (wm) wm.innerHTML = weeklyMenuHtml(userProfile.weeklyMenu);
    }

    // ── תווית גרסה (לאבחון) ──
    var settingsScreen = doc.getElementById('screen-settings');
    if (settingsScreen && !doc.getElementById('fitme-version-tag')) {
      var scroll = settingsScreen.querySelector('.scroll-content');
      if (scroll) {
        var tag = doc.createElement('div');
        tag.id = 'fitme-version-tag';
        tag.style.cssText = 'text-align:center;padding:16px 0 8px;color:var(--text-3);font-size:11px;letter-spacing:2px;opacity:0.7';
        tag.textContent = 'FitMe · v' + deps.appVersion;
        scroll.appendChild(tag);
      }
    } else if (doc.getElementById('fitme-version-tag')) {
      doc.getElementById('fitme-version-tag').textContent = 'FitMe · v' + deps.appVersion;
    }

    // wrap2: הגדרות Adaptive TDEE
    deps.renderAdaptiveSettings();

    // wrap3: מונה שימוש
    deps.renderUsage();
  }

  var API = {
    configure: configure,
    renderSettings: renderSettings
  };

  if (typeof window !== 'undefined') { window.SettingsPresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
