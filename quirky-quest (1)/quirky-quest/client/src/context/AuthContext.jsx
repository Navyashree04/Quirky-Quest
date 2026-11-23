import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../api/endpoints';
import { setAccessToken } from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'
  const [error, setError] = useState(null);

  // On first load, the access token lives only in memory and is gone after a
  // refresh — but the httpOnly refresh cookie survives. Use it to silently
  // restore the session instead of forcing a re-login on every page reload.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(res.data.accessToken);
        const meRes = await userApi.getMe();
        if (cancelled) return;
        setUser(meRes.data.user);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setStatus('guest');
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setError(null);
    const res = await authApi.register({ name, email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    setStatus('authenticated');
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    const res = await authApi.login({ email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const res = await userApi.getMe();
    setUser(res.data.user);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      isAuthenticated: status === 'authenticated',
      register,
      login,
      logout,
      refreshMe,
      setError,
    }),
    [user, status, error, register, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
