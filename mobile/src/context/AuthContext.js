import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredToken, setStoredToken } from '../utils/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setTokenState((prev) => prev ?? null);
      }
    }, 5000);
    (async () => {
      try {
        const t = await getStoredToken();
        if (!cancelled) setTokenState(t);
      } catch {
        if (!cancelled) setTokenState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  const setToken = useCallback(async (newToken) => {
    if (newToken != null && newToken !== '') {
      const value = typeof newToken === 'string' ? newToken : (newToken?.token ?? String(newToken));
      await setStoredToken(value);
      setTokenState(value);
    } else {
      await setStoredToken(null);
      setTokenState(null);
      setCurrentUserId(null);
    }
  }, []);

  const signOut = useCallback(() => setToken(null), [setToken]);

  return (
    <AuthContext.Provider value={{ token, setToken, signOut, loading, currentUserId, setCurrentUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
