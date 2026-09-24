// ══════════════════════════════════════════════════════════════════
// FitMe — Model Response Envelope (MRE-001, docs/specs/MRE_001_SPEC_v1.0.md §06–§08)
// Exclusive responsibility: a pure, deterministic, domain-agnostic TRANSPORT-envelope normalizer
// for model response text. It accepts exactly one surrounding Markdown code fence around the
// complete payload and nothing else:
//
//   [whitespace] ``` [json, any letter case] [spaces/tabs] LF|CRLF
//   <payload>
//   LF|CRLF [spaces/tabs] ``` [whitespace]
//
// and returns the inner payload byte-for-byte (only the final line terminator's CR is dropped).
// Every other input — plain JSON, prose before/after, several blocks, nested fences, 4+ backticks,
// tilde fences, any other language marker, missing newline structure, a truncated closer, an empty
// payload, a leading BOM, or a non-string — is returned UNCHANGED, so each caller's existing exact
// JSON.parse and existing validator remain the sole authority over what is accepted.
//
// Never: extracts a JSON-looking substring, tolerates prose, repairs JSON/quotes/commas/keys/
// schemas/semantics, guesses intent, logs, or throws. Grants no validity, authority, consent,
// Safety standing or trust — its output is ordinary untrusted text. Has no dependencies and no
// state. Deliberately NOT js/core/jsonUtils.js's permissive parseModelJSON() (MRE-001 §03).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var FENCE = '```';
  var OPENER_LINE = /^(json)?[ \t]*$/i;
  var CLOSER_LINE = /^[ \t]*```$/;
  var LEADING_WS = /^[ \t\r\n]+/;
  var TRAILING_WS = /[ \t\r\n]+$/;
  var HAS_NON_WS = /[^ \t\r\n]/;

  // MRE-001 §07 — returns the inner payload when (and only when) every step of the accepted
  // grammar holds; otherwise returns `text` itself, unchanged.
  function unwrapSingleJsonFence(text) {
    if (typeof text !== 'string') return text;

    var core = text.replace(LEADING_WS, '').replace(TRAILING_WS, '');

    // Opener: exactly three backticks, not four or more.
    if (core.slice(0, 3) !== FENCE || core.charAt(3) === '`') return text;

    // Opener line: empty or `json` (any case), then optional spaces/tabs, then a line break.
    var nl1 = core.indexOf('\n');
    if (nl1 < 0) return text;
    var openerLine = core.slice(3, nl1);
    if (openerLine.charAt(openerLine.length - 1) === '\r') openerLine = openerLine.slice(0, -1);
    if (!OPENER_LINE.test(openerLine)) return text;

    // Closer: exactly three backticks at the very end, not four or more, on its own later line.
    if (core.length < 6 || core.slice(-3) !== FENCE || core.charAt(core.length - 4) === '`') return text;
    var nl2 = core.lastIndexOf('\n');
    if (!(nl2 > nl1)) return text;
    if (!CLOSER_LINE.test(core.slice(nl2 + 1))) return text;

    // Inner payload, byte-for-byte except the CR of a CRLF line terminator.
    var inner = core.slice(nl1 + 1, nl2);
    if (inner.charAt(inner.length - 1) === '\r') inner = inner.slice(0, -1);

    if (inner.indexOf(FENCE) >= 0) return text;   // several blocks or a nested fence
    if (!HAS_NON_WS.test(inner)) return text;     // empty or whitespace-only payload
    return inner;
  }

  var API = {
    unwrapSingleJsonFence: unwrapSingleJsonFence
  };

  if (typeof window !== 'undefined') { window.ModelResponseEnvelope = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
