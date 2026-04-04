/**
 * On web, FormData must receive File/Blob for file uploads; RN accepts { uri, type, name }.
 * This helper returns the correct value to append so uploads work the same on web and native.
 */
import { Platform } from 'react-native';

const IMAGE_EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
};

/** Ensures filename has a valid image extension so server multer fileFilter accepts it. */
function ensureImageExtension(name, mime) {
  const ext = (IMAGE_EXT_BY_MIME[mime] || '.jpg').toLowerCase();
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif')) {
    return name;
  }
  const base = name ? name.replace(/\.[^/.]+$/, '') : 'image';
  return base + ext;
}

/**
 * Converts a data: URL to a File (no fetch; works reliably on web).
 * @param {string} dataUrl - e.g. "data:image/jpeg;base64,..."
 * @param {string} name - filename with extension
 * @returns {File}
 */
function dataUrlToFile(dataUrl, name) {
  const [header, base64] = dataUrl.split(',');
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const bin = atob(base64 || '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([new Blob([arr], { type: mime })], name, { type: mime });
}

/**
 * Converts an image asset to a value suitable for FormData.append(fieldName, value).
 * - Native: returns { uri, type, name } for React Native fetch.
 * - Web: returns a File (from data: URL without fetch, or from blob: via fetch) so the server receives the file.
 */
export async function assetToFormFile(asset) {
  const mime = asset.mimeType || 'image/jpeg';
  const rawName = asset.name || (asset.uri && asset.uri.split('/').pop()) || 'image';
  const name = ensureImageExtension(rawName, mime);

  if (Platform.OS !== 'web') {
    return { uri: asset.uri, type: mime, name };
  }

  const uri = asset.uri || '';
  // data: URL — convert without fetch (most reliable on web; no CORS/async issues)
  if (uri.startsWith('data:')) {
    try {
      return dataUrlToFile(uri, name);
    } catch (e) {
      console.warn('formDataFile: data URL parse failed', e);
    }
  }
  // blob: or file: — fetch and create File
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const type = blob.type || mime;
    return new File([blob], name, { type: type });
  } catch (e) {
    console.warn('formDataFile: fetch blob failed', e);
    throw e;
  }
}
