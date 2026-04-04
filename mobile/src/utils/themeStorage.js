/**
 * Theme storage: SecureStore on native, localStorage on web.
 * expo-secure-store does not support web, so we use localStorage for the browser.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'app_theme';
const isWeb = Platform.OS === 'web';

export async function getStoredTheme() {
  try {
    if (isWeb && typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(THEME_KEY);
      return v === 'dark' || v === 'light' ? v : null;
    }
    const v = await SecureStore.getItemAsync(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

export async function setStoredTheme(value) {
  if (value !== 'light' && value !== 'dark') return;
  try {
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(THEME_KEY, value);
  } catch (_) {}
}
