// ══════════════════════════════════════════════════════════════════
// FitMe — User-Stated Intake Activation Gate (USI-001, docs/specs/USI_001_SPEC_v1.0.md §08)
// Exclusive responsibility: the single boolean switch between "testable, not live" and a future,
// separately approved live activation of USI-001. Owns nothing else — no detection, no
// interpretation, no gating, no persistence.
//
// BINDING DEFAULT (§08.1, §08.2): enabled defaults to false and MUST remain false in production.
// Flipping it requires a separate Product/Architecture approval granted together with live User
// Knowledge persistence activation (§08.3). No production file flips it; only tests and the opt-in
// calibration harness may, through the explicitly named test-only setter below.
//
// While false: the Turn Understanding and CPI-001 request bodies are byte-identical to the
// pre-USI baseline, the orchestrator never calls USI-001, never reads the User Knowledge store and
// adds no key to the engine result (§08.1).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var _enabled = false; // BINDING DEFAULT — see header. Never true at module load.

  function isEnabled() { return _enabled === true; }

  // Test-only, explicitly named so misuse is obvious in review — never called from any production
  // file (checked by tests/usi001Static.test.js).
  function __setEnabledForTests__(value) {
    _enabled = value === true;
  }

  var API = {
    isEnabled: isEnabled,
    __setEnabledForTests__: __setEnabledForTests__
  };

  if (typeof window !== 'undefined') { window.UserStatedIntakeActivationGate = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
