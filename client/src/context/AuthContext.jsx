import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';
const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(!!localStorage.getItem('ims_token'));
  useEffect(() => {
    if (!localStorage.getItem('ims_token')) return;
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('ims_token')).finally(() => setLoading(false));
  }, []);
  const accept = d => { localStorage.setItem('ims_token', d.token); setUser(d.user); return d.user; };
  const value = {
    user, loading, setUser,
    login: async (email, password) => accept((await api.post('/auth/login', { email, password })).data),
    register: async body => accept((await api.post('/auth/register', body)).data),
    logout: () => { localStorage.removeItem('ims_token'); setUser(null); }
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
