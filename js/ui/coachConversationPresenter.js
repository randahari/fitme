// ══════════════════════════════════════════════════════════════════
// FitMe — Coach Conversation Presenter (DUC-001, docs/specs/DUC_001_SPEC_v1.0.md §15)
// Exclusive responsibility: rendering for the Coach Conversation Surface — the new
// #screen-coach-conversation markup (index.html). Never calls ClaudeProxyClient/CoachClient/
// callClaude directly, never owns governance (Need formation, Evidence, Eligibility, Reasoning,
// Safety, Decision Formation, Expression are all untouched by this module) — it only presents an
// already-fully-governed Delivery Intent that js/app.js's own DIRECT_TURN_PASS result handler
// hands it, exactly as js/trigger/triggerController.js does for the APP_READY path (a second
// presentation adapter for a second UI surface, never a second Expression/Decision authority).
//
// Follows js/coach/coachPresenter.js's own "המאמן כותב..." loading-state discipline as UX
// precedent ONLY (never its request architecture, never CoachClient/CoachPromptComposer).
//
// §15 step 7 (duplicate-rendering prevention): every rendering call below is keyed by turnId
// against a per-turn DOM slot — rendering twice for the same turnId overwrites that slot rather
// than appending a duplicate message.
//
// §13 (Clarification): lastClarificationRef is retained here, client-side, in-memory only, NEVER
// persisted — cleared the moment it is consumed for the next submitted turn (one-shot: only the
// very next turn carries it, per §02's own CurrentUserTurn.clarificationContext shape).
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // §13 — never a Firestore/Typed Memory write; a plain, session-scoped module-local variable,
  // reset naturally on page reload (matching CARF's own frozen "no provider-session memory"
  // principle — this is client-side UI-presentation state, never provider-side continuation).
  var lastClarificationRef = null;

  function inputEl() { return deps.documentRef.getElementById('coach-conversation-input'); }
  function submitEl() { return deps.documentRef.getElementById('coach-conversation-submit'); }
  function threadEl() { return deps.documentRef.getElementById('coach-conversation-thread'); }
  function errorEl() { return deps.documentRef.getElementById('coach-conversation-error'); }

  function getInputValue() {
    var el = inputEl();
    return el ? el.value : '';
  }

  function clearInput() {
    var el = inputEl();
    if (el) el.value = '';
  }

  // §03 — UI-level duplicate-submission guard (double-tap send): disables the submit control and
  // the text input for the duration of one in-flight runUserMessageEngine() call, mirroring the
  // existing "המאמן כותב..." loading-state discipline (coachPresenter.js:111-124).
  function setSubmitting(isSubmitting) {
    var btn = submitEl();
    var input = inputEl();
    if (btn) btn.disabled = !!isSubmitting;
    if (input) input.disabled = !!isSubmitting;
  }

  function hideError() {
    var el = errorEl();
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
  }

  // §17 — bounded error state (transport/timeout failure, or any pipeline outcome that never
  // reached DISPATCHED). Never fabricates coach-authored content — a neutral, presenter-owned
  // notice only, structurally distinct from any real Expression-rendered string.
  function showError(message) {
    var el = errorEl();
    if (el) { el.textContent = message || 'אירעה שגיאה. נסה שוב.'; el.classList.remove('hidden'); }
  }

  // Renders the user's own submitted turn text as one bubble, plus a pending "המאמן כותב..."
  // placeholder bubble for the eventual response — the placeholder's own element id is keyed by
  // turnId (§15 step 7), so the later renderResponse()/renderNoResponse() call for the SAME
  // turnId updates this exact slot rather than appending a second message.
  function renderUserTurn(turnId, text) {
    var container = threadEl();
    if (!container) return;

    var userBubble = deps.documentRef.createElement('div');
    userBubble.className = 'coach-conversation-bubble coach-conversation-bubble-user';
    userBubble.style.cssText = 'align-self:flex-end;background:#e8f0fe;border-radius:12px;padding:8px 12px;max-width:80%';
    userBubble.textContent = text;
    container.appendChild(userBubble);

    var responseBubble = deps.documentRef.createElement('div');
    responseBubble.className = 'coach-conversation-bubble coach-conversation-bubble-coach';
    responseBubble.id = 'coach-conversation-response-' + turnId;
    responseBubble.style.cssText = 'align-self:flex-start;background:#f1f1f1;border-radius:12px;padding:8px 12px;max-width:80%;opacity:.7';
    responseBubble.textContent = 'המאמן כותב...'; // coachPresenter.js's own loading-state discipline, reused as UX precedent only
    container.appendChild(responseBubble);
    if (typeof responseBubble.scrollIntoView === 'function') responseBubble.scrollIntoView({ block: 'end' });
  }

  // §15 step 4 — the SINGLE render function every outcome shape reaches: the TRR-supported path's
  // RECOMMENDATION/INITIATIVE-kind content, clarification-kind content, and UNSUPPORTED-kind
  // content (§12) all render through this same function — the user never sees a structural
  // difference, only different text, per Expression's own exclusive wording authority.
  function renderResponse(deliveryIntent, turnId) {
    var bubble = deps.documentRef.getElementById('coach-conversation-response-' + turnId);
    if (!bubble) return; // stale/unknown slot — never fabricate a new one out of turn
    bubble.textContent = deliveryIntent.renderedLanguage;
    bubble.style.opacity = '';
  }

  // §17 — a real, valid pipeline outcome that produced no Delivery Intent at all (Decision-Pass-
  // level Silence, e.g. Case A/C/E) or a Safety-DEFERRED/aborted/failed dispatch. Never rendered
  // as coach-authored content; the pending placeholder is simply removed, silently, matching
  // Expression's own "no output" discipline (EXP-29/EXP-50) applied at the UI layer.
  function renderNoResponse(turnId) {
    var bubble = deps.documentRef.getElementById('coach-conversation-response-' + turnId);
    if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble);
  }

  // §13/§14 — set by js/app.js's own DIRECT_TURN_PASS result handler after a successful render,
  // ONLY when the delivered TerminalDecision's own candidateProvenance[0].sourceCategory ===
  // 'DIRECT_USER_REQUEST' (real internal provenance already present on the governed decision
  // object itself, per §12/§14 — never a heuristic, never parsed from rendered text).
  function setClarificationRef(ref) { lastClarificationRef = ref || null; }

  // §02/§13 — one-shot: consumed (and cleared) exactly once, by the NEXT submitted turn's own
  // construction. Maps §13's clarificationRef shape ({turnId, opportunityId}) onto §02's own
  // CurrentUserTurn.clarificationContext shape ({priorTurnId, priorNeedRef}) — opportunityId and
  // needRef are the same string value throughout this SPEC (need.needRef is used verbatim as
  // DetectedOpportunity.id, §06).
  function consumeClarificationContext() {
    var ref = lastClarificationRef;
    lastClarificationRef = null;
    if (!ref) return undefined;
    return { priorTurnId: ref.turnId, priorNeedRef: ref.opportunityId };
  }

  var API = {
    configure: configure,
    getInputValue: getInputValue,
    clearInput: clearInput,
    setSubmitting: setSubmitting,
    hideError: hideError,
    showError: showError,
    renderUserTurn: renderUserTurn,
    renderResponse: renderResponse,
    renderNoResponse: renderNoResponse,
    setClarificationRef: setClarificationRef,
    consumeClarificationContext: consumeClarificationContext
  };

  if (typeof window !== 'undefined') { window.CoachConversationPresenter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
