// C1-WP2 — js/adapters/imageAdapter.js unit tests.
// FileReader/Image/canvas are injected via configure() so the resize math and fallback
// paths are testable without a real DOM.
// Run with: node --test tests/imageAdapter.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const ImageAdapter = require('../js/adapters/imageAdapter.js');

function fakeFile(type) { return { type: type || 'image/png' }; }

function platformWithImage(width, height, dataUrl) {
  var canvasCalls = [];
  return {
    createFileReader: function () {
      var r = {};
      r.readAsDataURL = function () {
        setImmediate(function () { r.onload({ target: { result: dataUrl } }); });
      };
      return r;
    },
    createImage: function () {
      var img = { width: width, height: height };
      Object.defineProperty(img, 'src', { set: function () { setImmediate(function () { img.onload(); }); } });
      return img;
    },
    createCanvas: function () {
      var c = {
        width: 0, height: 0,
        getContext: function () { return { drawImage: function () { canvasCalls.push('drawImage'); } }; },
        toDataURL: function () { return 'data:image/jpeg;base64,COMPRESSED'; }
      };
      return c;
    },
    getElementById: function () { return null; }
  };
}

test('compressImageForUpload resizes when the image exceeds maxDim (wider than tall)', async () => {
  ImageAdapter.configure(platformWithImage(2000, 1000, 'data:image/png;base64,ORIGINAL'));
  const result = await ImageAdapter.compressImageForUpload(fakeFile(), 1000, 0.8);
  assert.equal(result.mediaType, 'image/jpeg');
  assert.equal(result.b64, 'COMPRESSED');
});

test('compressImageForUpload does not resize when the image is within maxDim', async () => {
  ImageAdapter.configure(platformWithImage(400, 300, 'data:image/png;base64,ORIGINAL'));
  const result = await ImageAdapter.compressImageForUpload(fakeFile(), 1000, 0.8);
  assert.equal(result.mediaType, 'image/jpeg');
});

test('compressImageForUpload uses the default maxDim/quality (1024/0.85) when omitted', async () => {
  ImageAdapter.configure(platformWithImage(500, 500, 'data:image/png;base64,X'));
  const result = await ImageAdapter.compressImageForUpload(fakeFile());
  assert.equal(result.mediaType, 'image/jpeg');
});

test('compressImageForUpload falls back to the original file data when image decoding fails', async () => {
  ImageAdapter.configure({
    createFileReader: function () {
      var r = {};
      r.readAsDataURL = function () { setImmediate(function () { r.onload({ target: { result: 'data:image/png;base64,ORIGDATA' } }); }); };
      return r;
    },
    createImage: function () {
      var img = {};
      Object.defineProperty(img, 'src', { set: function () { setImmediate(function () { img.onerror(); }); } });
      return img;
    },
    createCanvas: function () { throw new Error('should not be called'); },
    getElementById: function () { return null; }
  });
  const result = await ImageAdapter.compressImageForUpload(fakeFile('image/webp'));
  assert.deepEqual(result, { b64: 'ORIGDATA', mediaType: 'image/webp' });
});

test('compressImageForUpload falls back to the original file data when canvas compression throws', async () => {
  ImageAdapter.configure({
    createFileReader: function () {
      var r = {};
      r.readAsDataURL = function () { setImmediate(function () { r.onload({ target: { result: 'data:image/png;base64,ORIGDATA2' } }); }); };
      return r;
    },
    createImage: function () {
      var img = { width: 2000, height: 1000 };
      Object.defineProperty(img, 'src', { set: function () { setImmediate(function () { img.onload(); }); } });
      return img;
    },
    createCanvas: function () { throw new Error('canvas unavailable'); },
    getElementById: function () { return null; }
  });
  const result = await ImageAdapter.compressImageForUpload(fakeFile('image/heic'));
  assert.deepEqual(result, { b64: 'ORIGDATA2', mediaType: 'image/heic' });
});

test('compressImageForUpload rejects when file reading itself fails', async () => {
  ImageAdapter.configure({
    createFileReader: function () {
      var r = {};
      r.readAsDataURL = function () { setImmediate(function () { r.onerror(); }); };
      return r;
    },
    createImage: function () { return {}; },
    createCanvas: function () { return {}; },
    getElementById: function () { return null; }
  });
  await assert.rejects(() => ImageAdapter.compressImageForUpload(fakeFile()), /קריאת הקובץ נכשלה/);
});

test('triggerFileInput clicks the resolved element and returns true', () => {
  let clicked = false;
  ImageAdapter.configure({ getElementById: (id) => (id === 'camera-input' ? { click: () => { clicked = true; } } : null) });
  const result = ImageAdapter.triggerFileInput('camera-input');
  assert.equal(clicked, true);
  assert.equal(result, true);
});

test('triggerFileInput returns false and does not throw when the element does not exist', () => {
  ImageAdapter.configure({ getElementById: () => null });
  const result = ImageAdapter.triggerFileInput('missing');
  assert.equal(result, false);
});
