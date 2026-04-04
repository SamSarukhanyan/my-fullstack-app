import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const API_PORT = '4004';
const API_PATH = '/api';

/** Returns true if URL is localhost (then we can auto-detect host for current environment). */
function isLocalhostUrl(url) {
  if (!url || typeof url !== 'string') return true;
  try {
    const u = url.trim().replace(/\/$/, '');
    return /^https?:\/\/localhost(\D|$)/i.test(u);
  } catch {
    return true;
  }
}

function trimUrl(url) {
  const s = typeof url === 'string' ? url.trim().replace(/\/$/, '') : '';
  return s || '';
}

/** Host from bundle script URL (e.g. http://192.168.5.6:8081/...). Reliable in Expo Go. */
function getHostFromScriptUrl() {
  try {
    const u = NativeModules?.SourceCode?.scriptURL;
    if (u && typeof u === 'string') {
      const m = u.match(/^(?:https?|exp):\/\/([^:/]+)/);
      if (m?.[1] && m[1] !== 'localhost') return m[1];
    }
  } catch (_) {}
  return null;
}

const getApiUrl = () => {
  const envUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;

  if (envUrl && trimUrl(envUrl) && !isLocalhostUrl(envUrl)) return trimUrl(envUrl);
  if (extraUrl && trimUrl(extraUrl) && !isLocalhostUrl(extraUrl)) return trimUrl(extraUrl);

  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${API_PORT}${API_PATH}`;
  }

  if (Platform.OS !== 'web') {
    const host =
      getHostFromScriptUrl() ||
      Constants.expoConfig?.hostUri?.replace(/^exp:\/\//, '').split(':')[0] ||
      (typeof Constants.manifest?.debuggerHost === 'string' && Constants.manifest.debuggerHost.split(':')[0]);
    if (host) return `http://${host}:${API_PORT}${API_PATH}`;
  }

  return `http://localhost:${API_PORT}${API_PATH}`;
};

/** Base URL for the server origin (no /api). Used to build full URLs for uploads (avatars, post images). */
const getBaseUrl = () => {
  const api = getApiUrl();
  return api.replace(/\/api\/?$/, '') || api;
};

export const apiUrl = () => getApiUrl();

/**
 * Returns full URL for an upload path (avatar or post image).
 * Handles both relative paths ("uploads/posts/abc.jpg") and legacy full paths from server.
 * @param {string} relativePath - e.g. "uploads/avatars/abc.jpg" or server full path
 * @returns {string} Full URL, e.g. "http://YOUR_EC2_IP/uploads/posts/abc.jpg"
 */
export function getUploadsUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return '';
  const trimmed = relativePath.trim().replace(/\\/g, '/');
  if (trimmed.startsWith('http')) return trimmed;
  const base = getBaseUrl();
  const idx = trimmed.indexOf('uploads/');
  const pathPart = idx >= 0 ? trimmed.slice(idx) : trimmed.replace(/^\//, '');
  return pathPart ? `${base}/${pathPart}` : '';
}

/**
 * User-friendly message when fetch fails (e.g. Network request failed on device).
 */
export function getNetworkErrorMessage(err) {
  const msg = err?.message || '';
  if (/network request failed|failed to fetch|could not connect/i.test(msg)) {
    return (
      'Cannot reach the server. On a real device (Expo Go): use the same Wi‑Fi as your PC and scan the QR from "npm start" in mobile/. ' +
      'The app uses the same host as the dev server. Ensure the server is running (npm run dev in server/).'
    );
  }
  return msg || 'Network error';
}

export async function apiFetch(path, options = {}) {
  const base = getApiUrl();
  const url = path.startsWith('http') ? path : `${base}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}

export async function apiFetchWithAuth(path, token, options = {}) {
  return apiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Send FormData with auth (e.g. avatar upload, post with photos).
 * Do NOT set Content-Type so fetch uses multipart/form-data with boundary.
 * options.timeoutMs — abort after N ms (for large uploads use e.g. 90000).
 */
export async function apiFetchWithAuthFormData(path, token, formData, options = {}) {
  const base = getApiUrl();
  const url = path.startsWith('http') ? path : `${base}/${path.replace(/^\//, '')}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };
  const timeoutMs = options.timeoutMs;
  let signal = options.signal;
  let timeoutId;
  if (timeoutMs && !signal) {
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }
  try {
    const res = await fetch(url, {
      ...options,
      method: options.method || 'POST',
      headers,
      body: formData,
      signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    return res;
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId);
    throw e;
  }
}
