// ══════════════════════════════════════════════════════════════════
// FitMe — Camera/Image Adapter (C1-WP2, Platform Adapters)
// אחריות בלעדית: עטיפת קריאת קובץ, טעינת תמונה ודחיסת canvas, והפעלת
// קלט מצלמה. אינו מחליט מה קורה עם התוצאה (זו אחריות הבקר שקורא לו).
// גורמי הפלטפורמה (FileReader/Image/canvas/document) מוזרקים דרך
// configure() כדי שהלוגיקה (חישוב מידות, נפילה חזרה בשגיאה) תהיה
// ניתנת לבדיקה ב-Node בלי DOM אמיתי; בברירת מחדל — האובייקטים הגלובליים
// של הדפדפן. חולץ מ-js/app.js ללא שינוי התנהגות — ראה
// docs/specs/C1_SPEC_v1.0.md §C1-WP2.
// ══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function defaultPlatform() {
    if (typeof window === 'undefined') return {};
    return {
      createFileReader: function () { return new FileReader(); },
      createImage: function () { return new Image(); },
      createCanvas: function () { return document.createElement('canvas'); },
      getElementById: function (id) { return document.getElementById(id); }
    };
  }

  var deps = defaultPlatform();
  function configure(injected) { deps = injected || defaultPlatform(); }

  // דחיסת תמונה לפני שליחה ל-Claude — מקטינה לרוחב/גובה מקסימלי maxDim ומייצאת
  // JPEG באיכות quality. אם משהו נכשל — נופלת בחזרה לקובץ המקורי כמו שהוא.
  // זהה לחלוטין ללוגיקה הקודמת (חישוב מידות, נתיבי נפילה).
  function compressImageForUpload(file, maxDim, quality) {
    if (typeof maxDim === 'undefined') maxDim = 1024;
    if (typeof quality === 'undefined') quality = 0.85;
    return new Promise(function (resolve, reject) {
      var reader = deps.createFileReader();
      reader.onerror = function () { reject(new Error('קריאת הקובץ נכשלה')); };
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        var img = deps.createImage();
        img.onerror = function () { resolve({ b64: dataUrl.split(',')[1], mediaType: file.type }); };
        img.onload = function () {
          try {
            var width = img.width, height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim; }
              else { width = Math.round(width * maxDim / height); height = maxDim; }
            }
            var canvas = deps.createCanvas();
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            var out = canvas.toDataURL('image/jpeg', quality);
            resolve({ b64: out.split(',')[1], mediaType: 'image/jpeg' });
          } catch (err) {
            resolve({ b64: dataUrl.split(',')[1], mediaType: file.type });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // הפעלת קלט מצלמה קיים ב-DOM (input[type=file][capture]) — מנגנון פלטפורמה
  // בלבד; החלטת product state (איזה מצב צילום) נשארת אצל המזמין.
  function triggerFileInput(elementId) {
    var el = deps.getElementById(elementId);
    if (el) el.click();
    return !!el;
  }

  var API = { configure: configure, compressImageForUpload: compressImageForUpload, triggerFileInput: triggerFileInput };

  if (typeof window !== 'undefined') { window.ImageAdapter = API; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})();
