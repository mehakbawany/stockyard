import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('ims_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401 && !['/login', '/register'].includes(location.pathname)) { localStorage.removeItem('ims_token'); location.href = '/login'; }
  return Promise.reject(e);
});
export const errMsg = e => e.response?.data?.message || e.message || 'Something went wrong';

export function useFetch(url, params) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(null);
  const key = JSON.stringify(params || {});
  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(url, { params }); setData(r.data); setError(null); }
    catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, [url, key]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
export default api;
