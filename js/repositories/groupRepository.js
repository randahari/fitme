// ══════════════════════════════════════════════════════════════════
// FitMe — Group Repository (C1-WP3, Repository Layer)
// אחריות בלעדית: עטיפת מנגנוני Firestore הגולמיים עבור קבוצות
// (groups/{code}) — קריאת חברים, בדיקת קיום קבוצה (semantics של קוד
// קבוצה), והצטרפות. getMembers כולל את לוגיקת ה-profile/day lookup
// המקורית (זהה לחלוטין: לולאת for-of טורית, אותו try/catch המחזיר []).
// אינו מציג UI (alert) ואינו מחליט ניתוב — אלו נשארים באחריות המזמין
// (js/app.js). חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP3.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var deps = null;
  function configure(injected) { deps = injected || {}; }

  // זהה ל-getGroupMembers() המקורי: קריאה טורית (for-of + await) על כל
  // חבר — פרופיל ואז מסמך היום שלו — עם reduce זהה לחישוב הקלוריות
  // וסימון isMe מול currentUid.
  async function getMembers(groupId, currentUid, todayKey) {
    try {
      var snap = await deps.db.collection('groups').doc(groupId).collection('members').get();
      var members = [];
      for (var i = 0; i < snap.docs.length; i++) {
        var doc = snap.docs[i];
        var uid = doc.id;
        var profileDoc = await deps.db.collection('users').doc(uid).get();
        if (profileDoc.exists) {
          var p = profileDoc.data();
          var todayDoc = await deps.db.collection('users').doc(uid).collection('days').doc(todayKey).get();
          var todayKcal = todayDoc.exists ? (todayDoc.data().meals || []).reduce(function (s, m) { return s + (m.kcal || 0); }, 0) : 0;
          members.push({ uid: uid, name: p.name, goal: p.goalKcal, kcal: todayKcal, streak: p.streak || 0, isMe: uid === currentUid });
        }
      }
      return members;
    } catch (e) { return []; }
  }

  // זהה לבדיקה המקורית ב-joinGroup(): קודם בודקים אם למסמך הקבוצה יש
  // תוכן (exists), ורק אם לא — בודקים fallback לפי חברים קיימים
  // (short-circuit זהה: שאילתת ה-members לא מתבצעת אם groupDoc קיים).
  async function groupExists(code) {
    var groupDoc = await deps.db.collection('groups').doc(code).get();
    if (groupDoc.exists) return true;
    var membersSnap = await deps.db.collection('groups').doc(code).collection('members').limit(1).get();
    return !!membersSnap.size;
  }

  // כתיבת חברות זהה לחלוטין (payload: { joinedAt: serverTimestamp() }),
  // משמשת גם את joinGroup וגם את finishOnboarding — שני הקריאה המקוריות
  // בנו את אותו payload בדיוק.
  function addMember(groupId, uid) {
    return deps.db.collection('groups').doc(groupId).collection('members').doc(uid).set({ joinedAt: deps.serverTimestamp() });
  }

  var API = {
    configure: configure,
    getMembers: getMembers,
    groupExists: groupExists,
    addMember: addMember
  };

  if (typeof window !== 'undefined') { window.GroupRepository = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
