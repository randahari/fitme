// C1-WP2 — js/adapters/claudeProxyClient.js unit tests.
// Run with: node --test tests/claudeProxyClient.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ClaudeProxyClient = require('../js/adapters/claudeProxyClient.js');

test('send rejects with the original error message when no user is provided', async () => {
  ClaudeProxyClient.configure({ fetchFn: async () => { throw new Error('should not be called'); }, getIdToken: async () => 'x' });
  await assert.rejects(() => ClaudeProxyClient.send({ foo: 1 }, null), /לא מחובר/);
});

test('send acquires a token, POSTs with the correct URL/headers/body, and returns parsed JSON', async () => {
  let capturedUrl = null, capturedOptions = null, tokenRequestedFor = null;
  ClaudeProxyClient.configure({
    getIdToken: async (user) => { tokenRequestedFor = user; return 'tok-123'; },
    fetchFn: async (url, options) => {
      capturedUrl = url; capturedOptions = options;
      return { ok: true, json: async () => ({ content: [{ text: 'hi' }] }) };
    }
  });
  const fakeUser = { uid: 'u1' };
  const result = await ClaudeProxyClient.send({ model: 'x' }, fakeUser);
  assert.equal(tokenRequestedFor, fakeUser);
  assert.equal(capturedUrl, 'https://us-central1-fitme-f9289.cloudfunctions.net/anthropicProxy');
  assert.equal(capturedOptions.method, 'POST');
  assert.equal(capturedOptions.headers['Content-Type'], 'application/json');
  assert.equal(capturedOptions.headers['Authorization'], 'Bearer tok-123');
  assert.equal(capturedOptions.body, JSON.stringify({ model: 'x' }));
  assert.deepEqual(result, { content: [{ text: 'hi' }] });
});

test('send throws using data.error when the response is not ok', async () => {
  ClaudeProxyClient.configure({
    getIdToken: async () => 'tok',
    fetchFn: async () => ({ ok: false, json: async () => ({ error: 'quota exceeded' }) })
  });
  await assert.rejects(() => ClaudeProxyClient.send({}, { uid: 'u1' }), /quota exceeded/);
});

test('send falls back to data.message, then the fixed Hebrew default, when data.error is absent', async () => {
  ClaudeProxyClient.configure({
    getIdToken: async () => 'tok',
    fetchFn: async () => ({ ok: false, json: async () => ({ message: 'oops' }) })
  });
  await assert.rejects(() => ClaudeProxyClient.send({}, { uid: 'u1' }), /oops/);

  ClaudeProxyClient.configure({
    getIdToken: async () => 'tok',
    fetchFn: async () => ({ ok: false, json: async () => ({}) })
  });
  await assert.rejects(() => ClaudeProxyClient.send({}, { uid: 'u1' }), /שגיאת שרת/);
});
