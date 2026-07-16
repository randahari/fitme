# REM-002 — Session State Reset and Account Isolation

**Document:** `docs/tasks/REM-002/SPEC.md`  
**Version:** 1.0  
**Status:** Draft — Engineering Readiness Review Required  
**Priority:** High  
**Owner:** FITME AI Architecture  
**Source Finding:** F14  
**Blocks:** REM-003 and Recommendation Engine progression

---

## 1. Objective

Prevent any user-scoped runtime state from surviving sign-out, authentication reset, or account switch.

After REM-002, a newly authenticated user may receive state only from:

1. Fresh initialization.
2. Persistent data loaded for that authenticated user's UID.
3. Explicit application-wide configuration that is not user-scoped.

No runtime data from a previous authenticated user may remain visible, writable, or consumable.

---

## 2. Problem

FITME is a static client application with global mutable runtime state, asynchronous AI calls, engine jobs, UI flags, caches, listeners, timers, and transient nutrition-analysis state.

The current authentication flow clears only selected top-level variables when authentication becomes unauthenticated. Partial cleanup creates a risk that state belonging to User A remains active when User B signs in without a full page reload.

Potential consequences include:

- Cross-account privacy leakage.
- Stale coach context.
- Incorrect UI content.
- AI responses applied to the wrong session.
- Old timers, listeners, promises, or callbacks mutating a new session.
- Cached calculations being reused under the wrong UID.

---

## 3. Scope

REM-002 covers all user-scoped client runtime state, including:

- Authentication-derived identity references.
- Loaded profile and day data.
- Favorites and quick-log runtime state.
- Coach card and trigger state.
- Adaptive TDEE proposal and history caches.
- Habit and Pattern Engine run state.
- Typed-memory runtime state and UI state.
- Nutrition analysis, validation, review, and image-analysis candidates.
- Barcode-scanning and lookup state.
- Workout and measurement transient state.
- User-scoped timers, intervals, listeners, subscriptions, and async callbacks.
- User-specific DOM content that may remain visible after authentication transition.

---

## 4. Out of Scope

REM-002 SHALL NOT:

- Delete persistent Firestore data.
- Redesign authentication.
- Add a new Firestore collection.
- Modify Firestore rules.
- Add or modify Cloud Functions.
- Redesign the UI.
- Implement a new engine registry beyond what is required for session cleanup.
- Solve canonical memory architecture.
- Implement Recommendation Engine behavior.
- Refactor the full application into modules.

---

## 5. Required Architecture

Create one central session lifecycle authority.

The authority SHALL provide an explicit reset operation used by the authentication lifecycle.

Required conceptual contract:

```text
auth transition detected
→ invalidate previous session
→ stop new user-scoped work
→ detach listeners and cancel timers where supported
→ clear all registered user-scoped runtime state
→ clear user-specific UI
→ establish new session identity
→ load the authenticated user's persistent data
→ initialize user-scoped modules
→ render ready state
```

Individual modules may clean only their own runtime state. They MUST NOT orchestrate authentication or reset unrelated modules.

---

## 6. Session Identity Guard

Every authenticated runtime session SHALL have a unique session identity.

At minimum, the implementation MUST distinguish:

- The authenticated UID.
- The active session generation or equivalent invalidation token.

Any asynchronous operation that began under an older session MUST be prevented from:

- Updating runtime state.
- Updating the DOM.
- Persisting data.
- Triggering an engine.
- Displaying an AI response.

Checking only `currentUser !== null` is insufficient. Completion must still belong to the same session that initiated the operation.

---

## 7. Reset Triggers

A complete reset SHALL occur when:

1. Firebase authentication changes from authenticated to unauthenticated.
2. Firebase authentication changes directly from UID A to UID B.
3. Sign-out is initiated.
4. Authentication initialization resolves without a user after a previous user session existed.
5. An authentication error requires returning to the login state.
6. A future account-switch flow changes the authenticated UID.

Duplicate reset requests during the same transition MUST be idempotent.

---

## 8. Required Reset Domains

The implementation SHALL inventory and reset every user-scoped runtime variable in the repository.

The inventory MUST include, but is not limited to:

### 8.1 Core session state
- Current authenticated user reference.
- User profile.
- Current day data.
- Favorites and other loaded user documents.
- Active UID or session marker.

### 8.2 AI and coach state
- Pending coach requests.
- Coach-card displayed flags.
- Generated coach text held in memory.
- Trigger candidates or pending live-text upgrades.
- User-specific prompt fragments or summaries.

### 8.3 Nutrition state
- Pending image analysis.
- Pending text analysis.
- Validation and review candidates.
- Meal editor AI insertion state.
- Quick-log onboarding AI state.
- Temporary image/base64 data.
- Barcode scanner and product lookup state.

### 8.4 Engine state
- Adaptive TDEE proposal.
- Adaptive history caches.
- Habit Engine session guards.
- Pattern Engine session guards.
- Trigger Engine runtime state.
- Pending engine promises or callbacks.

### 8.5 Typed memory state
- Loaded memory records.
- Memory transparency UI state.
- Pending memory edit/add form state.
- Module-local user references.

### 8.6 UI state
- User-specific rendered content.
- Open user-specific dialogs or sheets.
- Loading indicators tied to the previous session.
- Selected record or item references.
- Temporary error or success state containing user data.

### 8.7 Runtime resources
- Firestore listeners.
- DOM/event subscriptions created per session.
- Timers and intervals.
- Notification scheduling state.
- Abortable network requests.
- Any callback closure capturing the prior UID or user data.

---

## 9. Persistence Rules

Reset SHALL affect runtime state only.

It MUST NOT delete or modify:

- `users/{uid}`
- `users/{uid}/days/*`
- `users/{uid}/data/favorites`
- `users/{uid}/memories/*`
- Group membership.
- Barcode cache.
- Usage documents.
- Any other persistent user history.

A write already committed before sign-out remains valid.

A write that has not crossed the authoritative persistence boundary before session invalidation MUST NOT be allowed to complete under the next session.

---

## 10. Initialization Rules

For an authenticated user:

1. Establish the new active session identity.
2. Load profile, current-day data, and favorites for that UID.
3. Verify the session is still active after asynchronous loading.
4. Show onboarding or application state.
5. Initialize notifications and non-blocking engines.
6. Ensure each asynchronous continuation remains session-bound.

Initialization for an old session MUST terminate silently after invalidation.

---

## 11. Failure Handling

If cleanup of one optional module fails:

- Log the failure without exposing sensitive data.
- Continue clearing all other registered domains.
- Do not reuse the failed domain's state.
- Return to a safe login/loading state if complete isolation cannot be proven.

The system MUST never continue into a new authenticated session while knowingly retaining user-scoped state from the previous session.

---

## 12. Security and Privacy Invariants

1. User A's runtime data is never shown to User B.
2. User A's asynchronous operation cannot mutate User B's runtime or persistent data.
3. Old AI responses are discarded after session invalidation.
4. Old engine results are discarded after session invalidation.
5. User-specific UI is cleared before a new user's data is rendered.
6. Persistent data is loaded only through the active authenticated UID.
7. Reset is idempotent.
8. Future user-scoped modules must register cleanup or otherwise satisfy the central reset contract.

---

## 13. Automated Test Requirements

Tests SHALL cover at least:

1. Sign-out clears every inventoried runtime variable.
2. UID A → UID B switch clears A before B is rendered.
3. Delayed AI response from A is discarded after B signs in.
4. Delayed Firestore read from A is discarded after B signs in.
5. Delayed engine completion from A is discarded.
6. Duplicate reset calls remain safe.
7. Reset does not delete persistent data.
8. New login reloads correct data from source.
9. Typed-memory runtime data does not survive account switch.
10. Nutrition validation/review state does not survive account switch.
11. Timers/listeners are removed or invalidated.
12. Same-UID auth refresh does not unnecessarily destroy a valid active session unless required by Firebase lifecycle behavior.

Tests must verify both state clearing and stale-callback suppression.

---

## 14. Manual Acceptance Scenarios

### Scenario A — Normal sign-out
User A signs out.

Expected:
- Login screen is shown.
- No User A data remains visible.
- Runtime inventory is reset.
- No old request updates the screen afterward.

### Scenario B — Account switch
User A signs out and User B signs in without reloading the page.

Expected:
- User B sees only User B data.
- No coach text, meal candidate, memory record, cache, or engine result from User A is visible or consumed.

### Scenario C — Sign-out during AI analysis
User A starts meal-photo analysis and signs out before completion.

Expected:
- Candidate is cleared.
- Late response is discarded.
- Nothing is persisted.
- User B cannot see or save the result.

### Scenario D — Sign-out during engine work
Pattern or Habit Engine work begins under User A and completes after User B signs in.

Expected:
- Completion is ignored.
- No write or runtime mutation occurs under User B.

### Scenario E — Repeated reset
Several auth/reset signals fire during one transition.

Expected:
- No exception.
- No nested reset corruption.
- Final state is clean and deterministic.

---

## 15. Acceptance Criteria

REM-002 is complete only when:

- [ ] A complete repository-level inventory of user-scoped runtime state exists in the implementation report.
- [ ] One central session lifecycle reset path exists.
- [ ] Sign-out and UID change both use that path.
- [ ] All identified runtime domains are cleared.
- [ ] Old asynchronous completions are rejected using a session identity guard or equivalent.
- [ ] User-specific DOM state is cleared before new-user rendering.
- [ ] Reset is idempotent.
- [ ] Persistent Firestore data is unchanged.
- [ ] Automated tests cover required scenarios.
- [ ] Existing valid authentication and onboarding behavior remain functional.
- [ ] Habit, Pattern, Trigger, and Adaptive TDEE product behavior is unchanged.
- [ ] No Firestore rules or Cloud Functions changes are introduced.
- [ ] Engineering Readiness Review returns `READY`.
- [ ] Code review confirms no uncovered user-scoped state remains.

---

## 16. Engineering Readiness Gate

Before implementation, Claude SHALL inspect the actual repository and return an Engineering Readiness Review containing:

1. Exact user-scoped runtime state inventory by file and variable.
2. Exact asynchronous operations requiring session guards.
3. Exact timers/listeners/resources requiring cleanup.
4. Proposed minimal file changes.
5. Test plan.
6. Blocking ambiguities, if any.

Claude MUST NOT implement during this review step.

Implementation may begin only after ChatGPT reviews the findings and marks the task `READY`.

---

## 17. Expected File Scope

Expected files may include:

- `js/app.js`
- `js/memory.js`
- A small standalone session lifecycle module, only if justified by the current static script architecture.
- Test files.

No Firebase deployment is expected.

Any broader refactor requires explicit architecture approval.

---

## 18. Definition of Done

- Architecture approved.
- SPEC approved.
- Engineering Readiness Review = `READY`.
- Implementation complete.
- Automated tests passed.
- Code review passed.
- Roadmap updated.
- Changelog updated.
- Relevant architecture documentation updated.
- One logical commit created.
- Task marked closed.
