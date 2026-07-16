// ══════════════════════════════════════════════════════════════════
// FitMe — Nutrition Output Validation Layer (REM-001, v1.2)
// Pure, deterministic validation of AI-generated nutrition data.
// Per REM-001 §7: no persistence, no UI rendering, no LLM calls, no global-state mutation.
// Independently loadable in Node (dependency-free tests) and in the browser (window.NutritionOutputValidator).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var VALIDATOR_VERSION = '1.0.0';

  // ── Marker distinguishing "present but not a finite number" from "missing" ──
  // §10 rule 5 requires NaN/Infinity/-Infinity to be rejected, not silently treated as absent (null) or zero.
  // We keep such values as the actual non-finite number (e.g. NaN) so the validator's finiteness
  // checks (§11) can catch them explicitly, while a genuinely missing/empty field normalizes to null.
  function isBlank(v) {
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  }

  // §10 rule 2/3/4/5/7: convert accepted numeric strings to finite numbers; empty -> null; missing -> null;
  // never default an invalid/non-numeric value to 0 (rule 7 forbids reusing a zero-defaulting helper).
  function normalizeNumber(raw) {
    if (isBlank(raw)) return null;
    var n = (typeof raw === 'number') ? raw : parseFloat(String(raw).trim());
    return n; // may be NaN/Infinity/-Infinity on purpose — validator rejects these explicitly, never coerced to 0 or null here.
  }

  function normalizeString(raw) {
    if (raw === undefined || raw === null) return null;
    var s = String(raw).trim();
    return s === '' ? null : s;
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  // ── ER-005 Existing Data Model Mapping ──
  // existing FitMe item field -> validator field. Applied here, once, inside normalization,
  // so no call site duplicates this mapping (§15: "duplicated validation logic in individual
  // call sites is forbidden"). sodium has no validator field (passthrough, not validated).
  //   protein -> proteinG · carbs -> carbsG · fat -> fatG · sugar -> sugarG · fiber -> fiberG
  //   saturatedFat -> saturatedFatG (field does not exist in current AI schema yet — ER-003;
  //     accepted here so the rule "automatically activates" per ER-003 if a future schema adds it)
  //   amount + qty -> quantity (qty folded in as a multiplier; qty never becomes its own validator field)
  var MACRO_NAME_MAP = { proteinG: 'protein', carbsG: 'carbs', fatG: 'fat', sugarG: 'sugar', fiberG: 'fiber', saturatedFatG: 'saturatedFat' };

  // ── §10 Normalization ──
  // Produces a NutritionCandidate (§8) from the app's existing item/meal shape. Deterministic; does not mutate the input.
  function normalizeNutritionCandidate(raw, sourceType) {
    var out = { sourceType: sourceType || (raw && raw.sourceType) || 'unknown' };
    out.name = normalizeString(raw && raw.name);
    out.unit = normalizeString(raw && raw.unit);

    Object.keys(MACRO_NAME_MAP).forEach(function (validatorField) {
      var existingField = MACRO_NAME_MAP[validatorField];
      var v = normalizeNumber(raw ? raw[existingField] : undefined);
      if (v !== null && Number.isFinite(v)) v = round1(v);
      out[validatorField] = v;
    });

    var kcal = normalizeNumber(raw ? raw.kcal : undefined);
    out.kcal = (kcal !== null && Number.isFinite(kcal)) ? round1(kcal) : kcal;

    // amount + qty -> quantity (ER-005). qty is a multiplier (defaults to 1 when absent); amount is the base serving size.
    var amount = normalizeNumber(raw ? raw.amount : undefined);
    var qtyRaw = (raw && raw.qty !== undefined && raw.qty !== null) ? normalizeNumber(raw.qty) : 1;
    if (amount === null) {
      out.quantity = null;
    } else if (!Number.isFinite(amount) || !Number.isFinite(qtyRaw)) {
      out.quantity = NaN; // present but invalid — must trigger QUANTITY_INVALID, never silently null/0
    } else {
      out.quantity = amount * qtyRaw;
    }

    // sodium: passthrough only, never validated (ER-005), preserved for downstream display/persistence.
    if (raw && raw.sodium !== undefined) out.sodium = raw.sodium;

    return out;
  }

  // ── Validation result builders ──
  // Note: no rule in §11/§12 is defined as producing a "warning" (only HARD/SOFT errors) — the
  // `warnings` array in the output contract (§9) is therefore always empty in this version; no
  // warning-producing condition is invented here that REM-001 does not specify.
  function err(code, field, severity) { return { code: code, field: field || null, severity: severity }; }

  function isProvided(v) { return v !== null && v !== undefined; }
  function isFiniteProvided(v) { return isProvided(v) && Number.isFinite(v); }
  function isNonFiniteProvided(v) { return isProvided(v) && !Number.isFinite(v); }

  // ── §11/§12/§13 core validation of one NutritionCandidate ──
  // options.allowPartialMacros: MUST be explicitly passed true by the caller (never inferred) — §12.1.
  function validateNutritionCandidate(candidate, options) {
    options = options || {};
    var allowPartialMacros = options.allowPartialMacros === true;

    var errors = [];
    var warnings = [];
    var c = candidate || {};

    // 1. Structural validity
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      errors.push(err('NUTRITION_NOT_OBJECT', null, 'HARD'));
      return finalizeResult('REJECTED', c, errors, warnings, { calculatedMacroKcal: null, kcalDifference: null, kcalDifferenceRatio: null });
    }

    // 2. Required fields
    if (isBlank(c.name)) errors.push(err('NAME_REQUIRED', 'name', 'HARD'));
    if (!isProvided(c.kcal)) errors.push(err('KCAL_REQUIRED', 'kcal', 'HARD'));

    // 3. Numeric finiteness
    if (isNonFiniteProvided(c.kcal)) errors.push(err('KCAL_NON_FINITE', 'kcal', 'HARD'));
    var macroFields = ['proteinG', 'carbsG', 'fatG', 'saturatedFatG', 'sugarG', 'fiberG'];
    macroFields.forEach(function (f) {
      if (isNonFiniteProvided(c[f])) errors.push(err('MACRO_NON_FINITE', f, 'HARD'));
    });

    // 4. Non-negative values
    if (isFiniteProvided(c.kcal) && c.kcal < 0) errors.push(err('KCAL_NEGATIVE', 'kcal', 'HARD'));
    macroFields.forEach(function (f) {
      if (isFiniteProvided(c[f]) && c[f] < 0) errors.push(err('MACRO_NEGATIVE', f, 'HARD'));
    });

    // 5. Absolute corruption bounds
    if (isFiniteProvided(c.kcal) && c.kcal > 10000) errors.push(err('KCAL_ABSOLUTE_MAX', 'kcal', 'HARD'));
    if (isFiniteProvided(c.proteinG) && c.proteinG > 1000) errors.push(err('PROTEIN_ABSOLUTE_MAX', 'proteinG', 'HARD'));
    if (isFiniteProvided(c.carbsG) && c.carbsG > 1500) errors.push(err('CARBS_ABSOLUTE_MAX', 'carbsG', 'HARD'));
    if (isFiniteProvided(c.fatG) && c.fatG > 1000) errors.push(err('FAT_ABSOLUTE_MAX', 'fatG', 'HARD'));

    // 6. Cross-field constraints (only when both sides exist and are finite)
    if (isFiniteProvided(c.saturatedFatG) && isFiniteProvided(c.fatG) && c.saturatedFatG > c.fatG) {
      errors.push(err('SATURATED_GT_FAT', 'saturatedFatG', 'HARD'));
    }
    if (isFiniteProvided(c.sugarG) && isFiniteProvided(c.carbsG) && c.sugarG > c.carbsG) {
      errors.push(err('SUGAR_GT_CARBS', 'sugarG', 'HARD'));
    }
    if (isFiniteProvided(c.fiberG) && isFiniteProvided(c.carbsG) && c.fiberG > c.carbsG) {
      errors.push(err('FIBER_GT_CARBS', 'fiberG', 'HARD'));
    }
    if (isProvided(c.quantity) && (!Number.isFinite(c.quantity) || c.quantity <= 0)) {
      errors.push(err('QUANTITY_INVALID', 'quantity', 'HARD'));
    }

    // If any HARD error already exists, stop before soft rules (they are irrelevant once REJECTED,
    // and some soft computations assume finite inputs) — consistent with §13 status selection.
    var hasHard = errors.some(function (e) { return e.severity === 'HARD'; });

    var metrics = { calculatedMacroKcal: null, kcalDifference: null, kcalDifferenceRatio: null };

    if (!hasHard) {
      // 7. Macro completeness (soft)
      var macrosPresent = isFiniteProvided(c.proteinG) && isFiniteProvided(c.carbsG) && isFiniteProvided(c.fatG);
      if (!macrosPresent && !allowPartialMacros) {
        errors.push(err('MACROS_INCOMPLETE', null, 'SOFT'));
      }

      // 8. Macro-to-calorie consistency (soft) — only computable when kcal + all 3 macros are finite.
      if (macrosPresent && isFiniteProvided(c.kcal)) {
        var calculatedMacroKcal = c.proteinG * 4 + c.carbsG * 4 + c.fatG * 9;
        var kcalDifference = Math.abs(c.kcal - calculatedMacroKcal);
        var kcalDifferenceRatio = kcalDifference / Math.max(c.kcal, 1);
        metrics = { calculatedMacroKcal: round1(calculatedMacroKcal), kcalDifference: round1(kcalDifference), kcalDifferenceRatio: kcalDifferenceRatio };
        if (kcalDifference > 120 && kcalDifferenceRatio > 0.35) {
          errors.push(err('MACRO_KCAL_MISMATCH', 'kcal', 'SOFT'));
        }
      }

      // 9. Zero-value plausibility (soft)
      if (isFiniteProvided(c.kcal)) {
        var anyMacroPositive = [c.proteinG, c.carbsG, c.fatG].some(function (v) { return isFiniteProvided(v) && v > 0; });
        if (c.kcal === 0 && anyMacroPositive) errors.push(err('ZERO_KCAL_WITH_MACROS', 'kcal', 'SOFT'));

        var allMacrosZero = ['proteinG', 'carbsG', 'fatG'].every(function (f) { return isFiniteProvided(c[f]) && c[f] === 0; });
        if (c.kcal >= 100 && allMacrosZero) errors.push(err('POSITIVE_KCAL_ALL_MACROS_ZERO', null, 'SOFT'));
      }
    }

    // 10. Final status selection
    var status = hasHard ? 'REJECTED' : (errors.length ? 'REVIEW_REQUIRED' : 'VALID');
    return finalizeResult(status, c, errors, warnings, metrics);
  }

  function finalizeResult(status, normalized, errors, warnings, metrics) {
    return {
      status: status,
      normalized: normalized,
      errors: errors,
      warnings: warnings,
      metrics: metrics
    };
  }

  // ── ER-002: shared multi-item + aggregate orchestration ──
  // items: array of raw AI items already carrying sourceType (or sourceType passed separately).
  // Returns { overallStatus, itemResults: [NutritionValidationResult...], aggregateResult }.
  // "Suggestions are informational only and are never persisted or validated" (ER-002) — callers must
  // not pass suggestion arrays into this function.
  function validateNutritionMeal(rawItems, sourceType, options) {
    var items = Array.isArray(rawItems) ? rawItems : [];
    var itemResults = items.map(function (raw) {
      var candidate = normalizeNutritionCandidate(raw, sourceType);
      return validateNutritionCandidate(candidate, options);
    });

    // Recalculate meal totals from the normalized per-item values (sum of finite values; missing treated as 0 for summation only).
    function sumField(f) {
      var any = false;
      var total = 0;
      itemResults.forEach(function (r) {
        var v = r.normalized[f];
        if (Number.isFinite(v)) { total += v; any = true; }
      });
      return any ? round1(total) : null;
    }

    var aggregateCandidate = {
      name: 'meal-aggregate',
      quantity: null,
      unit: null,
      kcal: sumField('kcal'),
      proteinG: sumField('proteinG'),
      carbsG: sumField('carbsG'),
      fatG: sumField('fatG'),
      saturatedFatG: sumField('saturatedFatG'),
      sugarG: sumField('sugarG'),
      fiberG: sumField('fiberG'),
      sourceType: sourceType
    };
    var aggregateResult = validateNutritionCandidate(aggregateCandidate, options);

    var anyItemRejected = itemResults.some(function (r) { return r.status === 'REJECTED'; });
    var anyItemReview = itemResults.some(function (r) { return r.status === 'REVIEW_REQUIRED'; });

    var overallStatus;
    if (anyItemRejected || aggregateResult.status === 'REJECTED') overallStatus = 'REJECTED';
    else if (anyItemReview || aggregateResult.status === 'REVIEW_REQUIRED') overallStatus = 'REVIEW_REQUIRED';
    else overallStatus = 'VALID';

    return { overallStatus: overallStatus, itemResults: itemResults, aggregateResult: aggregateResult };
  }

  var API = {
    VERSION: VALIDATOR_VERSION,
    normalizeNutritionCandidate: normalizeNutritionCandidate,
    validateNutritionCandidate: validateNutritionCandidate,
    validateNutritionMeal: validateNutritionMeal
  };

  if (typeof window !== 'undefined') {
    window.NutritionOutputValidator = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
