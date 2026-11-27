// Owner: Member 1 (Frontend Developer)
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getToken()); // restoring a saved session

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback(({ token: t, user: u }) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  // on first load: if a token is saved, check it is still valid and fetch the profile
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    api
      .me()
      .then(({ user: u }) => !cancelled && setUser(u))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // any API call that gets a 401 logs the user out
  useEffect(() => {
    window.addEventListener('connectx:unauthorized', logout);
    return () => window.removeEventListener('connectx:unauthorized', logout);
  }, [logout]);

  const login = async (email, password) => saveSession(await api.login(email, password));
  const register = async (username, email, password) =>
    saveSession(await api.register(username, email, password));
  const updateProfile = async (patch) => setUser((await api.updateProfile(patch)).user);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
