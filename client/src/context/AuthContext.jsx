import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setSamityCode } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'samity_token';
const USER_KEY = 'samity_user';
const SAMITY_KEY = 'samity_code';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [samityCode, setSamityState] = useState(
    () => localStorage.getItem(SAMITY_KEY) || 'default'
  );

  useEffect(() => {
    setAuthToken(token);
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    setSamityCode(samityCode);
    localStorage.setItem(SAMITY_KEY, samityCode);
  }, [samityCode]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = async (loginField, password) => {
    const { data } = await api.post('/auth/login', { login: loginField, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) return;
    const { data } = await api.get('/auth/me');
    setUser({
      id: data.user._id,
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role,
      memberId: data.user.memberId?._id || data.user.memberId,
    });
  };

  const value = useMemo(
    () => ({
      token,
      user,
      samityCode,
      setSamityCode: setSamityState,
      login,
      logout,
      refreshMe,
      isAdmin: user?.role === 'admin',
      isAccountant: user?.role === 'accountant',
      isMember: user?.role === 'member',
    }),
    [token, user, samityCode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
