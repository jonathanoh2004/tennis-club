import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from './authClient';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { username, userId } or null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await authApi.getUser();
        setUser(u ? { username: u.username, userId: u.userId } : null);
      } catch { setUser(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const value = {
    user, loading,
    async signIn(username, password) { await authApi.signIn({ username, password }); const u = await authApi.getUser(); setUser(u ? { username: u.username, userId: u.userId } : null); },
    async signUp(username, password, email) { return authApi.signUp({ username, password, email }); },
    async signOut() { await authApi.signOut(); setUser(null); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
