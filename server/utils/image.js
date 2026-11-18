// Server-side validation of files uploaded straight to ImageKit from the browser.
const imagekit = require('../config/imagekit');
const { httpError } = require('./helpers');
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 2 * 1024 * 1024;

async function removeFile(fileId) {
  if (!fileId) return;
  try { await imagekit.deleteFile(fileId); } catch (e) { console.warn('ImageKit delete failed:', e.message); }
}

async function verifyUpload(fileId) {
  let f;
  try { f = await imagekit.getFileDetails(fileId); } catch { throw httpError(400, 'Uploaded image was not found on ImageKit'); }
  if (!ALLOWED.includes(f.mime)) { await removeFile(fileId); throw httpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed'); }
  if (f.size > MAX_BYTES) { await removeFile(fileId); throw httpError(400, 'Image must be 2MB or smaller'); }
  return f; // use f.url (trusted) - never a URL sent by the client
}

// Applies an image change to a mongoose doc. Arbitrary URLs from the client are ignored.
async function applyImage(doc, body, urlField, idField) {
  const newId = body[idField];
  if (newId && newId !== doc[idField]) {
    const f = await verifyUpload(newId);
    await removeFile(doc[idField]);
    doc[urlField] = f.url; doc[idField] = newId;
  } else if (body.removeImage) {
    await removeFile(doc[idField]);
    doc[urlField] = ''; doc[idField] = '';
  }
}
module.exports = { applyImage, removeFile, verifyUpload };
