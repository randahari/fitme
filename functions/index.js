const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// ── מכסות יומיות לכל משתמש (הגנה על החשבון מפני שימוש-יתר) ──
// תמונות הן הקריאה היקרה — מכסה נמוכה יותר. טקסט זול — מכסה גבוהה.
const PHOTO_DAILY_LIMIT = 50;
const TEXT_DAILY_LIMIT = 300;

// מפתח תאריך לפי UTC (הפונקציה רצה ב-UTC). המכסה מתאפסת בחצות UTC —
// קצת אחרי חצות בישראל, וזה בסדר גמור למטרת הגבלת קצב.
function utcDateKey() {
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}

// סיווג הקריאה: 'photo' אם יש בלוק תמונה, אחרת 'text'
function classifyCall(body) {
  try {
    for (const m of (body.messages || [])) {
      if (Array.isArray(m.content) && m.content.some(c => c && c.type === 'image')) return 'photo';
    }
  } catch (e) {}
  return 'text';
}

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

    // ── אכיפת מכסה יומית ──
    // מונה יומי מנוהל בטרנזקציה (מונע מרוץ בין בקשות מקבילות).
    // הספירה מתבצעת לפני הקריאה ל-Anthropic — כך שגם ניסיונות חוזרים נספרים.
    const kind = classifyCall(body);
    const today = utcDateKey();
    const usageRef = admin.firestore().collection('usage').doc(uid);
    try {
      const allowed = await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(usageRef);
        const data = snap.exists ? snap.data() : {};
        const daily = (data.daily && data.daily.date === today)
          ? { date: today, photo: data.daily.photo || 0, text: data.daily.text || 0 }
          : { date: today, photo: 0, text: 0 };
        const limit = kind === 'photo' ? PHOTO_DAILY_LIMIT : TEXT_DAILY_LIMIT;
        if ((daily[kind] || 0) >= limit) return false;
        daily[kind] = (daily[kind] || 0) + 1;
        tx.set(usageRef, { daily }, { merge: true });
        return true;
      });
      if (!allowed) {
        res.status(429).json({
          error: 'Daily limit reached',
          message: kind === 'photo'
            ? 'הגעת למכסת התמונות היומית. נסה שוב מחר, או רשום את הארוחה ידנית.'
            : 'הגעת למכסת הבקשות היומית. נסה שוב מחר.'
        });
        return;
      }
    } catch (e) {
      // אם בדיקת המכסה נכשלה (למשל תקלת רשת ל-Firestore) — לא חוסמים משתמש לגיטימי
      console.warn('rate limit check failed (allowing):', e.message);
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

      // ── רישום שימוש למעקב עלויות (סכומים מצטברים) ──
      if (data.usage) {
        try {
          await usageRef.set({
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
