/**
 * Token storage: SecureStore on native, localStorage on web.
 * expo-secure-store does not support web, so we fall back to localStorage for the browser.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const isWeb = Platform.OS === 'web';

export async function getStoredToken() {
  try {
    if (isWeb && typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(value) {
  try {
    if (isWeb && typeof localStorage !== 'undefined') {
      if (value != null && value !== '') {
        localStorage.setItem(TOKEN_KEY, value);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    if (value != null && value !== '') {
      await SecureStore.setItemAsync(TOKEN_KEY, value);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (_) {}
}

export async function removeStoredToken() {
  return setStoredToken(null);
}
