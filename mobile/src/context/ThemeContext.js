import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { getStoredTheme, setStoredTheme } from '../utils/themeStorage';
import { lightColors, darkColors } from '../theme';

const ThemeContext = createContext(null);

/** Time for one full loader rotation (must match CircularLoader duration); the theme switches only after that. */
const LOADER_FULL_CIRCLE_MS = 1000;

/** Background before the theme loads: dark (#121212) to avoid a white flash on startup when the user selected dark mode. */
const LOADING_BG = darkColors.background;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');
  const [ready, setReady] = useState(false);
  const [themeSwitching, setThemeSwitching] = useState(false);

  const colors = theme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    (async () => {
      try {
        const saved = await getStoredTheme();
        if (saved === 'dark' || saved === 'light') setThemeState(saved);
      } catch (_) {}
      setReady(true);
    })();
  }, []);

  const setTheme = useCallback(async (value) => {
    if (value !== 'light' && value !== 'dark') return;
    if (themeSwitching) return;
    setThemeSwitching(true);
    try {
      await setStoredTheme(value);
      await new Promise((r) => setTimeout(r, LOADER_FULL_CIRCLE_MS));
      setThemeState(value);
    } finally {
      setThemeSwitching(false);
    }
  }, [themeSwitching]);

  const value = { theme, setTheme, colors, ready, themeSwitching };

  return (
    <ThemeContext.Provider value={value}>
      {ready ? children : <View style={[styles.loadingRoot, { backgroundColor: LOADING_BG }]} />}
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1 },
});

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
