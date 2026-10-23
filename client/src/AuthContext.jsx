import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null)); // ProtectedRoute then redirects to /login
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setUser(null); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}
