// ══════════════════════════════════════════════════════════════════
// FitMe — Profile Metrics (C1-WP1, Shared Pure Utilities)
// אחריות בלעדית: חישובי מטריקות גוף/פרופיל טהורים (BMI, קטגוריית BMI,
// אחוז שומן, יעד חלבון) — ללא DOM, ללא state גלובלי, ללא Firebase.
// חולצה מ-js/app.js ללא שינוי סמנטי — ראה docs/specs/C1_SPEC_v1.0.md
// §C1-WP1, docs/architecture/C1_WP0_INVENTORY.md.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function calcBMI(weight, height) {
    var h = height / 100;
    return Math.round((weight / (h * h)) * 10) / 10;
  }

  function getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'תת משקל', color: '#378ADD' };
    if (bmi < 25) return { label: 'תקין', color: '#1D9E75' };
    if (bmi < 30) return { label: 'עודף משקל', color: '#BA7517' };
    return { label: 'השמנה', color: '#E24B4A' };
  }

  function calcBodyFat(weight, height, age, gender) {
    var bmi = calcBMI(weight, height);
    if (gender === 'male') return Math.round((1.20 * bmi) + (0.23 * age) - 16.2);
    return Math.round((1.20 * bmi) + (0.23 * age) - 5.4);
  }

  // B3: פורמולה משותפת, ללא שינוי (הועברה כלשונה מ-js/app.js).
  function computeProteinTarget(weight) {
    return Math.round((weight || 75) * 1.8);
  }

  var API = { calcBMI: calcBMI, getBMICategory: getBMICategory, calcBodyFat: calcBodyFat, computeProteinTarget: computeProteinTarget };

  if (typeof window !== 'undefined') { window.ProfileMetrics = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
