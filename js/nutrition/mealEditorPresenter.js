// ══════════════════════════════════════════════════════════════════
// FitMe — Meal Editor Presenter (C1-WP5C, Nutrition Application Domain)
// אחריות בלעדית: רינדור ה-HTML של עורך הארוחה (עם תאימות מלאה ל-onclick
// המוטבעים הקיימים — "binding compatibility handlers"), באנר האימות,
// תג המקור, ו-UI ההתאוששות (REM-001 §14.3). אינו מבצע כתיבות עמידות
// (Firestore/PersistenceGateway) — אלה נשארות באחריות js/app.js (WP5D).
// אינו מבצע קריאות AI (WP5A) ואינו מחשב טוטלים/עורך טיוטה בעצמו (WP5B) —
// קורא ל-MealDraft.computeTotals לצורך הרינדור בלבד. תלוי ישירות
// ב-StringUtils (esc) ו-MealDraft, באותו דפוס require/window שכבר קיים
// בין js/nutrition/mealDraft.js למודולים הטהורים שהוא תלוי בהם; משתמש
// ב-configure() עבור גישת DOM וקריאות-חזרה ל-app.js (אינו מודול טהור —
// זקוק לפלטפורמה). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP5C.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var StringUtils = (typeof module !== 'undefined' && module.exports)
    ? require('../core/stringUtils.js')
    : window.StringUtils;
  var MealDraft = (typeof module !== 'undefined' && module.exports)
    ? require('./mealDraft.js')
    : window.MealDraft;
  var esc = StringUtils.esc;

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  function fmtQty(q) { return (q % 1 === 0 ? q : q.toFixed(2).replace(/0$/, '')); }

  // תג מקור המידע — זהה לחלוטין ל-sourceBadge() המקורי.
  function sourceBadge(pendingMeal) {
    if (!pendingMeal || !pendingMeal.source) return '';
    var map = {
      off:   { icon: '🌐', text: 'מאגר עולמי (Open Food Facts)', bg: 'var(--teal-light)', fg: 'var(--teal)' },
      label: { icon: '📷', text: 'נקרא מהתווית ע"י Claude',       bg: 'var(--gold-light)', fg: 'var(--gold)' },
      group: { icon: '👥', text: 'מהמאגר של הקבוצה' + (pendingMeal.addedByName ? ' · הוסף ע"י ' + pendingMeal.addedByName : ''), bg: 'var(--gold-light)', fg: 'var(--gold)' }
    };
    var s = map[pendingMeal.source];
    if (!s) return '';
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:' + s.bg + ';color:' + s.fg + ';border-radius:20px;padding:5px 12px;font-size:12px;font-weight:500;margin-bottom:10px">' + s.icon + ' ' + esc(s.text) + '</div>';
  }

  // REM-001 §16/ER-004 — זהה לחלוטין ל-nutritionValidationBanner() המקורי. mealRequiresNutritionValidation
  // ו-NutritionOutputValidator מוזרקים (משותפים גם ל-addMeal ב-app.js — WP5D — אין שכפול לוגיקה).
  function nutritionValidationBanner(pendingMeal) {
    if (!pendingMeal || !pendingMeal.items.length || !deps.mealRequiresNutritionValidation(pendingMeal)) return '';
    var gate = deps.nutritionOutputValidator.validateNutritionMeal(pendingMeal.items, pendingMeal.source || 'text');
    if (gate.overallStatus === 'VALID') return '';
    var text = gate.overallStatus === 'REJECTED'
      ? 'אחד הערכים לא הגיוני (למשל שלילי או חסר). תקן אותו לפני השמירה.'
      : 'FITME לא בטוח לגמרי בהערכה הזו. בדוק את הקלוריות והערכים לפני השמירה.';
    return '<div class="result-note">🔎 ' + esc(text) + '</div>';
  }

  // רינדור עורך הארוחה — זהה לחלוטין ל-renderEditor() המקורי, כולל כל ה-onclick המוטבעים
  // (עדיין קוראים לשמות הפונקציות הגלובליות הקיימות ב-app.js — "binding compatibility").
  function renderEditor(pendingMeal, editingItemIdx) {
    var box = deps.getElementById('food-result');
    if (!box || !pendingMeal) return;
    var t = MealDraft.computeTotals(pendingMeal.items);
    var fld = function (lbl, id, val, type) {
      return '<label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--text-3)">' + lbl + '<input id="' + id + '" ' + (type === 'text' ? 'type="text"' : 'type="number" inputmode="decimal"') + ' value="' + esc(val) + '"></label>';
    };
    var rows = pendingMeal.items.map(function (it, i) {
      if (editingItemIdx === i) {
        return '<div class="ed-item" style="flex-direction:column;align-items:stretch;gap:8px">' +
          fld('שם', 'edit-name', it.name, 'text') +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
            fld('כמות', 'edit-amount', it.amount) +
            fld('יחידה', 'edit-unit', it.unit, 'text') +
            fld('קלוריות', 'edit-kcal', it.kcal) +
            fld('חלבון (g)', 'edit-protein', it.protein) +
            fld('פחמימות (g)', 'edit-carbs', it.carbs) +
            fld('שומן (g)', 'edit-fat', it.fat) +
            fld('סיבים (g)', 'edit-fiber', it.fiber) +
            fld('סוכר (g)', 'edit-sugar', it.sugar) +
            fld('נתרן (mg)', 'edit-sodium', it.sodium) +
          '</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn-small" style="flex:1" onclick="editorSaveEdit(' + i + ')">שמור ✓</button>' +
            '<button class="btn-ghost" style="flex:1;margin-top:0;padding:8px" onclick="editorCancelEdit()">בטל</button>' +
          '</div>' +
        '</div>';
      }
      var amountTxt = it.amount ? (fmtQty(Math.round(it.amount * it.qty * 10) / 10) + ' ' + esc(it.unit)) : '';
      return '<div class="ed-item">' +
        '<button class="ed-del" onclick="editorDelete(' + i + ')" aria-label="הסר פריט">×</button>' +
        '<div class="ed-info" onclick="editorEdit(' + i + ')" style="cursor:pointer">' +
          '<div class="ed-name">' + esc(it.name) + ' <span style="font-size:12px;color:var(--gold)">✏️</span></div>' +
          '<div class="ed-sub">' + amountTxt + (amountTxt ? ' · ' : '') + Math.round(it.kcal * it.qty) + " קל' · " + Math.round(it.protein * it.qty) + 'g חלבון</div>' +
        '</div>' +
        '<div class="ed-qty">' +
          '<button onclick="editorQty(' + i + ',-1)" aria-label="הפחת כמות">−</button>' +
          '<span>×' + fmtQty(it.qty) + '</span>' +
          '<button onclick="editorQty(' + i + ',1)" aria-label="הגדל כמות">+</button>' +
        '</div>' +
      '</div>';
    }).join('');
    var suggs = pendingMeal.suggestions.length
      ? '<div class="ed-sugg-title">אולי היה גם?</div><div class="ed-suggs">' +
        pendingMeal.suggestions.map(function (s, i) { return '<button class="ed-sugg" onclick="editorAddSuggestion(' + i + ')">+ ' + esc(s.name) + ' <span>(' + Math.round(s.kcal) + ')</span></button>'; }).join('') + '</div>'
      : '';
    box.innerHTML =
      '<div class="result-header"><div class="result-name">' + esc(pendingMeal.name) + '</div></div>' +
      nutritionValidationBanner(pendingMeal) +
      sourceBadge(pendingMeal) +
      '<div class="ed-items">' + (rows || '<div class="empty-state">אין פריטים — הוסף למטה</div>') + '</div>' +
      suggs +
      '<div class="ed-add-row">' +
        '<input type="text" id="ed-add-input" placeholder="הוסף פריט (למשל: כף טחינה)">' +
        '<button class="btn-small" id="ed-add-btn" onclick="editorAddCustom()">הוסף</button>' +
      '</div>' +
      '<div class="ed-total">' +
        '<div class="ed-total-kcal">' + Math.round(t.kcal) + " <span>קל'</span></div>" +
        '<div class="ed-total-macros">חלבון ' + Math.round(t.protein) + "g · פחמ' " + Math.round(t.carbs) + 'g · שומן ' + Math.round(t.fat) + 'g<br><span>סיבים ' + Math.round(t.fiber) + 'g · סוכר ' + Math.round(t.sugar) + 'g · נתרן ' + Math.round(t.sodium) + 'mg</span></div>' +
      '</div>' +
      (pendingMeal.note ? '<div class="result-note">' + esc(pendingMeal.note) + '</div>' : '') +
      '<div class="result-actions">' +
        '<button class="btn-primary" onclick="addMeal()">הוסף ליום ✓</button>' +
        '<button class="btn-ghost" onclick="addMealAndFavorite()">הוסף ושמור כמועדף</button>' +
        '<button class="btn-ghost" onclick="cancelFood()">בטל</button>' +
      '</div>';
  }

  // §14.3 — REJECTED: נתיב התאוששות ברור. זהה לחלוטין ל-showAiRejectedRecovery() המקורי.
  // fallbackName = foodSession?.originalInput (מוזרק ע"י app.js — אין תלות ישירה ב-foodSession).
  function showAiRejectedRecovery(retryFn, originalMeal, fallbackName) {
    deps.getElementById('food-questionnaire').classList.add('hidden');
    deps.clearPendingMeal();
    var box = deps.getElementById('food-result');
    if (!box) { deps.alertFn('לא הצלחתי לוודא את הערכים התזונתיים. נסה שוב.'); return; }
    box.classList.remove('hidden');
    box.innerHTML =
      '<div class="result-header"><div class="result-name">לא הצלחתי לוודא את הערכים</div></div>' +
      '<div class="result-note">משהו בהערכה יצא לא הגיוני. אפשר לנסות שוב, להזין את הארוחה ידנית, או לבטל.</div>' +
      '<div class="result-actions">' +
        '<button class="btn-primary" id="rem001-retry-btn">נסה שוב</button>' +
        '<button class="btn-ghost" id="rem001-manual-btn">הזן ידנית</button>' +
        '<button class="btn-ghost" id="rem001-cancel-btn">בטל</button>' +
      '</div>';
    var retryBtn = deps.getElementById('rem001-retry-btn');
    var manualBtn = deps.getElementById('rem001-manual-btn');
    var cancelBtn = deps.getElementById('rem001-cancel-btn');
    if (retryBtn) retryBtn.onclick = function () { box.classList.add('hidden'); if (typeof retryFn === 'function') retryFn(); };
    if (manualBtn) manualBtn.onclick = function () {
      deps.showMealEditor({ name: (originalMeal && originalMeal.name) || fallbackName || 'ארוחה', items: [], suggestions: [], source: 'manual' });
    };
    if (cancelBtn) cancelBtn.onclick = function () { deps.cancelFood(); };
  }

  var API = {
    configure: configure,
    fmtQty: fmtQty,
    sourceBadge: sourceBadge,
    nutritionValidationBanner: nutritionValidationBanner,
    renderEditor: renderEditor,
    showAiRejectedRecovery: showAiRejectedRecovery
  };

  if (typeof window !== 'undefined') { window.MealEditorPresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
