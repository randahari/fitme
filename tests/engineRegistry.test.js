// B2 — Engine Registry / Orchestrator tests.
// Dependency-free: Node's built-in test runner + assert only.
// Run with: node --test tests/engineRegistry.test.js
//
// B2 Code Review Round 4: EngineRegistry.run() now takes a single
// EngineRunRequest object { trigger, actions: {<id>: string}, payloads:
// {<id>: any}, context: {...} } instead of run(trigger, context) with one
// shared action/payload for every eligible engine. All tests below use the
// new shape.

const test = require('node:test');
const assert = require('node:assert/strict');
const EngineRegistry = require('../js/engineRegistry.js');

function freshRegistry() {
  EngineRegistry.__resetForTests__();
}

test('1. register() accepts a valid engine and rejects a duplicate id', () => {
  freshRegistry();
  const ok1 = EngineRegistry.register({ id: 'a', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  assert.equal(ok1.ok, true);
  const ok2 = EngineRegistry.register({ id: 'a', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  assert.equal(ok2.ok, false);
  assert.equal(ok2.error.code, 'DUPLICATE_ID');
});

test('2. an engine may declare multiple triggers', () => {
  freshRegistry();
  const res = EngineRegistry.register({
    id: 'multi', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL'], dependsOn: [],
    run: async (ctx) => ({ status: 'SUCCESS', output: ctx.trigger })
  });
  assert.equal(res.ok, true);
  assert.deepEqual(EngineRegistry.getAll()[0].triggers, ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL']);
});

test('3. trigger filtering — engine only runs for a trigger it declared', async () => {
  freshRegistry();
  let calls = 0;
  EngineRegistry.register({ id: 'onlyAppReady', triggers: ['APP_READY'], dependsOn: [], run: async () => { calls++; return { status: 'SUCCESS' }; } });
  const planOther = EngineRegistry.buildPlan('SOURCE_DATA_CHANGED');
  assert.deepEqual(planOther.order, []);
  const summaryOther = await EngineRegistry.run({ trigger: 'SOURCE_DATA_CHANGED', actions: { onlyAppReady: 'X' } });
  assert.deepEqual(summaryOther.executionOrder, []);
  assert.equal(calls, 0);
  await EngineRegistry.run({ trigger: 'APP_READY', actions: { onlyAppReady: 'X' } });
  assert.equal(calls, 1);
});

test('4. valid action — an engine may dispatch on context.action and succeed', async () => {
  freshRegistry();
  EngineRegistry.register({
    id: 'triggerEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED'], dependsOn: [],
    run: async (ctx) => {
      if (ctx.action === 'DAILY_COACH_CHECK') return { status: 'SUCCESS', output: 'daily-check-ran' };
      if (ctx.action === 'WORKOUT_COMPLETED') return { status: 'SUCCESS', output: 'workout-ran' };
      return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'unrecognized action' } };
    }
  });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { triggerEngine: 'DAILY_COACH_CHECK' } });
  assert.equal(summary.results.triggerEngine.status, 'SUCCESS');
  assert.equal(summary.results.triggerEngine.output, 'daily-check-ran');
});

test('5. invalid action — the adapter validates action itself and reports SKIPPED', async () => {
  freshRegistry();
  EngineRegistry.register({
    id: 'triggerEngine', triggers: ['APP_READY'], dependsOn: [],
    run: async (ctx) => {
      const known = ['DAILY_COACH_CHECK'];
      if (known.indexOf(ctx.action) === -1) return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'unrecognized action: ' + ctx.action } };
      return { status: 'SUCCESS' };
    }
  });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { triggerEngine: 'NOT_A_REAL_ACTION' } });
  assert.equal(summary.results.triggerEngine.status, 'SKIPPED');
  assert.equal(summary.results.triggerEngine.error.code, 'UNKNOWN_ACTION');
});

test('6. duplicate engine id is rejected', () => {
  freshRegistry();
  EngineRegistry.register({ id: 'dup', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  const res = EngineRegistry.register({ id: 'dup', triggers: ['MANUAL'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  assert.equal(res.ok, false);
  assert.equal(res.error.code, 'DUPLICATE_ID');
});

test('7. unknown dependency is rejected at plan-validation time', () => {
  freshRegistry();
  EngineRegistry.register({ id: 'b', triggers: ['APP_READY'], dependsOn: ['ghost'], run: async () => ({ status: 'SUCCESS' }) });
  const plan = EngineRegistry.buildPlan('APP_READY');
  assert.equal(plan.ok, false);
  assert.equal(plan.error.code, 'UNKNOWN_DEPENDENCY');
});

test('8. circular dependency is rejected', () => {
  freshRegistry();
  EngineRegistry.register({ id: 'x', triggers: ['APP_READY'], dependsOn: ['y'], run: async () => ({ status: 'SUCCESS' }) });
  EngineRegistry.register({ id: 'y', triggers: ['APP_READY'], dependsOn: ['x'], run: async () => ({ status: 'SUCCESS' }) });
  const plan = EngineRegistry.buildPlan('APP_READY');
  assert.equal(plan.ok, false);
  assert.equal(plan.error.code, 'CIRCULAR_DEPENDENCY');
});

test('9. deterministic ordering — topological with lexicographic tie-break, stable across repeated calls', () => {
  freshRegistry();
  EngineRegistry.register({ id: 'zeta', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  EngineRegistry.register({ id: 'alpha', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  EngineRegistry.register({ id: 'beta', triggers: ['APP_READY'], dependsOn: ['alpha'], run: async () => ({ status: 'SUCCESS' }) });
  const plan1 = EngineRegistry.buildPlan('APP_READY');
  const plan2 = EngineRegistry.buildPlan('APP_READY');
  assert.deepEqual(plan1.order, ['alpha', 'beta', 'zeta']); // alpha before its dependent beta; zeta lexicographically last among independents
  assert.deepEqual(plan1.order, plan2.order);
});

test('10. dependency failure propagation — dependent engine is SKIPPED, not executed', async () => {
  freshRegistry();
  let dependentRan = false;
  EngineRegistry.register({ id: 'upstream', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'FAILED', error: { code: 'BOOM', message: 'upstream failed' } }) });
  EngineRegistry.register({ id: 'downstream', triggers: ['APP_READY'], dependsOn: ['upstream'], run: async () => { dependentRan = true; return { status: 'SUCCESS' }; } });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { upstream: 'RUN', downstream: 'RUN' } });
  assert.equal(summary.results.upstream.status, 'FAILED');
  assert.equal(summary.results.downstream.status, 'SKIPPED');
  assert.equal(summary.results.downstream.error.code, 'DEPENDENCY_FAILED');
  assert.equal(dependentRan, false);
});

test('11. independent engine continuation — an unrelated engine still runs after another fails', async () => {
  freshRegistry();
  EngineRegistry.register({ id: 'failing', triggers: ['APP_READY'], dependsOn: [], run: async () => { throw new Error('boom'); } });
  EngineRegistry.register({ id: 'independent', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS', changed: true }) });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { failing: 'RUN', independent: 'RUN' } });
  assert.equal(summary.results.failing.status, 'FAILED');
  assert.equal(summary.results.failing.error.code, 'ENGINE_THREW');
  assert.equal(summary.results.independent.status, 'SUCCESS');
});

test('12. session invalidation — a stale orchestration run must not apply its effect', async () => {
  freshRegistry();
  let generation = 1;
  const SessionLifecycleStub = {
    getGeneration: () => generation,
    isCurrent: (gen) => gen === generation
  };
  let applied = null;
  EngineRegistry.register({
    id: 'sessionScoped', triggers: ['SOURCE_DATA_CHANGED'], dependsOn: [],
    run: async (ctx) => {
      const gen = ctx.sessionGeneration;
      await new Promise((resolve) => setTimeout(resolve, 10)); // simulate a Firestore round-trip
      if (!SessionLifecycleStub.isCurrent(gen)) return { status: 'SKIPPED', error: { code: 'STALE_SESSION', message: 'session changed mid-flight' } };
      applied = 'ran-under-original-session';
      return { status: 'SUCCESS' };
    }
  });
  const pending = EngineRegistry.run({
    trigger: 'SOURCE_DATA_CHANGED', actions: { sessionScoped: 'RUN' },
    context: { sessionGeneration: SessionLifecycleStub.getGeneration() }
  });
  generation++; // account switch mid-flight
  const summary = await pending;
  assert.equal(summary.results.sessionScoped.status, 'SKIPPED');
  assert.equal(applied, null, 'stale completion must not apply its effect after a session change');
});

test('13. registration shape — the four B2-approved engines register without conflict', () => {
  freshRegistry();
  const habit = EngineRegistry.register({ id: 'habitEngine', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  const pattern = EngineRegistry.register({ id: 'patternEngine', triggers: ['APP_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  const adaptive = EngineRegistry.register({ id: 'adaptiveTdeeEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  const triggerEng = EngineRegistry.register({ id: 'triggerEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'AUTH_SESSION_READY'], dependsOn: [], run: async () => ({ status: 'SUCCESS' }) });
  [habit, pattern, adaptive, triggerEng].forEach((r) => assert.equal(r.ok, true));
  assert.equal(EngineRegistry.getAll().length, 4);
  const ids = EngineRegistry.getAll().map((e) => e.id).sort();
  assert.deepEqual(ids, ['adaptiveTdeeEngine', 'habitEngine', 'patternEngine', 'triggerEngine']);
});

test('14. preservation pattern — Habit/Pattern-style dependsOn:[] with a soft internal call degrades gracefully', async () => {
  freshRegistry();
  // Proxy for the real Habit/Pattern relationship (B2 SPEC §11 Rule 10): Pattern's
  // internal call to Habit is a plain function call inside its own run(), not a
  // registry dependsOn edge, so a Habit failure never skips Pattern.
  let habitRanInsidePattern = false;
  async function habitLikeLogic() { throw new Error('habit engine failed internally'); }
  EngineRegistry.register({ id: 'habitEngine', triggers: ['APP_READY'], dependsOn: [], run: async () => { throw new Error('registry-invoked habit run also fails'); } });
  EngineRegistry.register({
    id: 'patternEngine', triggers: ['APP_READY'], dependsOn: [], // locked to [] — not a registry dependency
    run: async () => {
      try { await habitLikeLogic(); habitRanInsidePattern = true; } catch (e) { /* graceful degradation, proceeds on raw data alone */ }
      return { status: 'SUCCESS', changed: true, output: 'computed-from-raw-data' };
    }
  });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { habitEngine: 'RECOMPUTE', patternEngine: 'RECOMPUTE' } });
  assert.equal(summary.results.habitEngine.status, 'FAILED');
  assert.equal(summary.results.patternEngine.status, 'SUCCESS', 'Pattern must still succeed even though Habit failed, since dependsOn is []');
  assert.equal(habitRanInsidePattern, false);
});

test('15. preservation pattern — Adaptive TDEE-style engine dispatches distinct actions across its declared triggers', async () => {
  freshRegistry();
  const seen = [];
  EngineRegistry.register({
    id: 'adaptiveTdeeEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL'], dependsOn: [],
    run: async (ctx) => { seen.push(ctx.trigger + '/' + ctx.action); return { status: 'SUCCESS' }; }
  });
  await EngineRegistry.run({ trigger: 'APP_READY', actions: { adaptiveTdeeEngine: 'ADAPTIVE_CHECK' } });
  await EngineRegistry.run({ trigger: 'SOURCE_DATA_CHANGED', actions: { adaptiveTdeeEngine: 'WEIGHT_CHANGED' }, payloads: { adaptiveTdeeEngine: { deltaKg: -0.3 } } });
  await EngineRegistry.run({ trigger: 'MANUAL', actions: { adaptiveTdeeEngine: 'ADAPTIVE_RECHECK' } });
  assert.deepEqual(seen, ['APP_READY/ADAPTIVE_CHECK', 'SOURCE_DATA_CHANGED/WEIGHT_CHANGED', 'MANUAL/ADAPTIVE_RECHECK']);
});

test('16. preservation pattern — Trigger Engine-style single engine handles workout payload without a second engine id', async () => {
  freshRegistry();
  let receivedBurn = null;
  EngineRegistry.register({
    id: 'triggerEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'AUTH_SESSION_READY'], dependsOn: [],
    run: async (ctx) => {
      if (ctx.action === 'WORKOUT_COMPLETED') { receivedBurn = ctx.payload && ctx.payload.burn; return { status: 'SUCCESS', output: 'workout-card-shown' }; }
      if (ctx.action === 'LOCAL_NOTIFICATION_SCHEDULE') return { status: 'SUCCESS', output: 'notifications-scheduled' };
      return { status: 'SUCCESS', output: 'daily-check' };
    }
  });
  const summary = await EngineRegistry.run({
    trigger: 'SOURCE_DATA_CHANGED', actions: { triggerEngine: 'WORKOUT_COMPLETED' }, payloads: { triggerEngine: { burn: 420 } }
  });
  assert.equal(summary.results.triggerEngine.status, 'SUCCESS');
  assert.equal(receivedBurn, 420);
  assert.equal(EngineRegistry.getAll().length, 1, 'Trigger Engine remains a single registered engine across all its actions');
});

test('17. plan validation error surfaces without throwing run()', async () => {
  freshRegistry();
  EngineRegistry.register({ id: 'lonely', triggers: ['APP_READY'], dependsOn: ['missing'], run: async () => ({ status: 'SUCCESS' }) });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { lonely: 'RUN' } });
  assert.equal(summary.executionOrder.length, 0);
  assert.equal(summary.planError.code, 'UNKNOWN_DEPENDENCY');
});

test('18. race reproduction — sequential execution reduces (but a shared TOCTOU gate alone does not fully prevent) double-run risk; see tests/habitSingleFlight.test.js for the actual production fix', async () => {
  freshRegistry();
  // This test documents why sequential order is not, by itself, a sufficient
  // correctness guarantee (B2 Code Review Round 4): it demonstrates the shared
  // gated function running exactly once when engines execute in registration/plan
  // order, but the real fix against reordering is the single-flight wrapper
  // (tested independently in habitSingleFlight.test.js), not this ordering property.
  let gateLastRun = null;
  let concurrentEntries = 0;
  let maxConcurrentEntries = 0;
  let historyReads = 0;
  async function sharedGatedFunction() {
    const today = 'day-1';
    if (gateLastRun === today) return;
    concurrentEntries++;
    maxConcurrentEntries = Math.max(maxConcurrentEntries, concurrentEntries);
    historyReads++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    gateLastRun = today;
    concurrentEntries--;
  }
  EngineRegistry.register({ id: 'habitEngine', triggers: ['APP_READY'], dependsOn: [], run: async () => { await sharedGatedFunction(); return { status: 'SUCCESS' }; } });
  EngineRegistry.register({ id: 'patternEngine', triggers: ['APP_READY'], dependsOn: [], run: async () => { await sharedGatedFunction(); return { status: 'SUCCESS' }; } });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: { habitEngine: 'RECOMPUTE', patternEngine: 'RECOMPUTE' } });
  assert.equal(summary.results.habitEngine.status, 'SUCCESS');
  assert.equal(summary.results.patternEngine.status, 'SUCCESS');
  assert.equal(historyReads, 1);
  assert.equal(maxConcurrentEntries, 1);
});

test('19. real-shape action routing — one APP_READY EngineRunRequest with a full per-engine actions map correctly reaches all four B2 engines with the right action, no cross-contamination', async () => {
  freshRegistry();
  const calls = [];
  EngineRegistry.register({
    id: 'habitEngine', triggers: ['APP_READY'], dependsOn: [],
    run: async (ctx) => { assert.equal(ctx.action, 'RECOMPUTE'); calls.push('habit:' + ctx.action); return { status: 'SUCCESS' }; }
  });
  EngineRegistry.register({
    id: 'patternEngine', triggers: ['APP_READY'], dependsOn: [],
    run: async (ctx) => { assert.equal(ctx.action, 'RECOMPUTE'); calls.push('pattern:' + ctx.action); return { status: 'SUCCESS' }; }
  });
  EngineRegistry.register({
    id: 'adaptiveTdeeEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'MANUAL'], dependsOn: [],
    run: async (ctx) => {
      if (ctx.trigger === 'APP_READY' && ctx.action === 'ADAPTIVE_CHECK') { calls.push('adaptive:ADAPTIVE_CHECK'); return { status: 'SUCCESS' }; }
      if (ctx.trigger === 'SOURCE_DATA_CHANGED' && ctx.action === 'WEIGHT_CHANGED') { calls.push('adaptive:WEIGHT_CHANGED'); return { status: 'SUCCESS' }; }
      return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'n/a' } };
    }
  });
  EngineRegistry.register({
    id: 'triggerEngine', triggers: ['APP_READY', 'SOURCE_DATA_CHANGED', 'AUTH_SESSION_READY'], dependsOn: [],
    run: async (ctx) => {
      if (ctx.trigger === 'APP_READY' && ctx.action === 'DAILY_COACH_CHECK') { calls.push('trigger:DAILY_COACH_CHECK'); return { status: 'SUCCESS' }; }
      if (ctx.trigger === 'SOURCE_DATA_CHANGED' && ctx.action === 'WORKOUT_COMPLETED') { calls.push('trigger:WORKOUT_COMPLETED'); return { status: 'SUCCESS' }; }
      return { status: 'SKIPPED', error: { code: 'UNKNOWN_ACTION', message: 'n/a' } };
    }
  });

  // Full per-engine action map for APP_READY (matches runAppReadyEngines()).
  const summary1 = await EngineRegistry.run({
    trigger: 'APP_READY',
    actions: { habitEngine: 'RECOMPUTE', patternEngine: 'RECOMPUTE', adaptiveTdeeEngine: 'ADAPTIVE_CHECK', triggerEngine: 'DAILY_COACH_CHECK' }
  });
  assert.deepEqual(calls.sort(), ['adaptive:ADAPTIVE_CHECK', 'habit:RECOMPUTE', 'pattern:RECOMPUTE', 'trigger:DAILY_COACH_CHECK'].sort());
  assert.equal(summary1.results.habitEngine.status, 'SUCCESS');
  assert.equal(summary1.results.patternEngine.status, 'SUCCESS');
  assert.equal(summary1.results.adaptiveTdeeEngine.status, 'SUCCESS');
  assert.equal(summary1.results.triggerEngine.status, 'SUCCESS');

  // A targeted SOURCE_DATA_CHANGED action for only adaptiveTdeeEngine must reach only it.
  calls.length = 0;
  const summary2 = await EngineRegistry.run({ trigger: 'SOURCE_DATA_CHANGED', actions: { adaptiveTdeeEngine: 'WEIGHT_CHANGED' } });
  assert.deepEqual(calls, ['adaptive:WEIGHT_CHANGED']);
  assert.equal(summary2.results.triggerEngine.status, 'SKIPPED', 'triggerEngine is eligible for SOURCE_DATA_CHANGED but received no action for this run');
  assert.equal(summary2.results.triggerEngine.error.code, 'NO_ACTION_FOR_ENGINE');

  // A targeted SOURCE_DATA_CHANGED action for only triggerEngine must reach only it.
  calls.length = 0;
  const summary3 = await EngineRegistry.run({ trigger: 'SOURCE_DATA_CHANGED', actions: { triggerEngine: 'WORKOUT_COMPLETED' }, payloads: { triggerEngine: { burn: 300 } } });
  assert.deepEqual(calls, ['trigger:WORKOUT_COMPLETED']);
  assert.equal(summary3.results.adaptiveTdeeEngine.status, 'SKIPPED');
  assert.equal(summary3.results.adaptiveTdeeEngine.error.code, 'NO_ACTION_FOR_ENGINE');
});

test('20. an eligible engine with no explicit action is SKIPPED without its run() being invoked at all', async () => {
  freshRegistry();
  let invoked = false;
  EngineRegistry.register({ id: 'engineWithoutAction', triggers: ['APP_READY'], dependsOn: [], run: async () => { invoked = true; return { status: 'SUCCESS' }; } });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY', actions: {} }); // no action supplied for this engine
  assert.equal(invoked, false, 'run() must never be called when no explicit action was provided');
  assert.equal(summary.results.engineWithoutAction.status, 'SKIPPED');
  assert.equal(summary.results.engineWithoutAction.error.code, 'NO_ACTION_FOR_ENGINE');
});

test('21. payload is routed only to the engine it was addressed to', async () => {
  freshRegistry();
  const seenPayloads = {};
  EngineRegistry.register({ id: 'a', triggers: ['APP_READY'], dependsOn: [], run: async (ctx) => { seenPayloads.a = ctx.payload; return { status: 'SUCCESS' }; } });
  EngineRegistry.register({ id: 'b', triggers: ['APP_READY'], dependsOn: [], run: async (ctx) => { seenPayloads.b = ctx.payload; return { status: 'SUCCESS' }; } });
  await EngineRegistry.run({
    trigger: 'APP_READY',
    actions: { a: 'RUN', b: 'RUN' },
    payloads: { a: { secret: 42 } } // only 'a' gets a payload
  });
  assert.deepEqual(seenPayloads.a, { secret: 42 });
  assert.equal(seenPayloads.b, null, 'an engine with no payload entry must receive null, never another engine\'s payload');
});

test('22. no action derived from undefined — omitting the actions map entirely SKIPs every eligible engine', async () => {
  freshRegistry();
  let invoked = false;
  EngineRegistry.register({ id: 'solo', triggers: ['APP_READY'], dependsOn: [], run: async () => { invoked = true; return { status: 'SUCCESS' }; } });
  const summary = await EngineRegistry.run({ trigger: 'APP_READY' }); // actions omitted entirely
  assert.equal(invoked, false);
  assert.equal(summary.results.solo.status, 'SKIPPED');
  assert.equal(summary.results.solo.error.code, 'NO_ACTION_FOR_ENGINE');
});
