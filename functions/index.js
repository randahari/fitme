const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// ── Anthropic API Proxy ──
// Proxy מאומת עם Firebase Auth שמעביר בקשות ל-Anthropic API
// המפתח נשמר בסוד בצד השרת, המשתמשים לא צריכים מפתח משלהם
exports.anthropicProxy = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    cors: [
      'https://randahari.github.io',
      'http://localhost:5000',
      'http://localhost:8080'
    ],
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60
  },
  async (req, res) => {
    // ── רק POST ──
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // ── אימות Firebase ──
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      res.status(401).json({ error: 'Missing auth token' });
      return;
    }

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch (e) {
      res.status(401).json({ error: 'Invalid auth token' });
      return;
    }

    // ── ולידציית גוף הבקשה ──
    const body = req.body;
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // הגנה מפני שימוש יתר: הגבלת max_tokens
    if (body.max_tokens && body.max_tokens > 2000) {
      body.max_tokens = 2000;
    }

    // ── העברה ל-Anthropic ──
    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY.value().trim().replace(/[^\x00-\x7F]/g, ''),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      const data = await anthropicRes.json();

      // ── רישום שימוש למעקב עלויות ──
      if (data.usage) {
        try {
          await admin.firestore().collection('usage').doc(uid).set({
            lastUsed: admin.firestore.FieldValue.serverTimestamp(),
            totalInputTokens: admin.firestore.FieldValue.increment(data.usage.input_tokens || 0),
            totalOutputTokens: admin.firestore.FieldValue.increment(data.usage.output_tokens || 0),
            totalRequests: admin.firestore.FieldValue.increment(1)
          }, { merge: true });
        } catch (e) { console.warn('usage log failed:', e.message); }
      }

      res.status(anthropicRes.status).json(data);
    } catch (e) {
      console.error('Anthropic proxy error:', e);
      res.status(500).json({ error: 'Proxy request failed', message: e.message });
    }
  }
);
