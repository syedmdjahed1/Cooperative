import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setSamityCode } from '../api/client';

const AuthContext = createContext(null);

const SAMITY_KEY = 'samity_code';

const DEMO_USER = {
  id: 'demo',
  email: 'demo@demo.local',
  phone: null,
  role: 'admin',
  memberId: null,
};

export function AuthProvider({ children }) {
  const [samityCode, setSamityState] = useState(
    () => localStorage.getItem(SAMITY_KEY) || 'default'
  );

  useEffect(() => {
    setSamityCode(samityCode);
    localStorage.setItem(SAMITY_KEY, samityCode);
  }, [samityCode]);

  useEffect(() => {
    localStorage.removeItem('samity_token');
    localStorage.removeItem('samity_user');
  }, []);

  const value = useMemo(
    () => ({
      user: DEMO_USER,
      samityCode,
      setSamityCode: setSamityState,
      isAdmin: true,
      isAccountant: true,
      isMember: false,
    }),
    [samityCode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
