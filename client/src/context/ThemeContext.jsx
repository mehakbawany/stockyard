import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const Ctx = createContext();
const DEFAULTS = { theme: 'light', accent: 'amber', density: 'comfortable', sound: true, motion: true, sidebarCollapsed: false, autoRefresh: true };
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }) {
  const [s, setS] = useState(() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('ims_settings')) }; } catch { return DEFAULTS; } });
  const [sysDark, setSysDark] = useState(matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { const m = matchMedia('(prefers-color-scheme: dark)'); const h = e => setSysDark(e.matches); m.addEventListener('change', h); return () => m.removeEventListener('change', h); }, []);
  const resolved = s.theme === 'system' ? (sysDark ? 'dark' : 'light') : s.theme;
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = resolved; el.dataset.accent = s.accent; el.dataset.density = s.density; el.dataset.motion = s.motion ? 'on' : 'off';
    localStorage.setItem('ims_settings', JSON.stringify(s));
  }, [s, resolved]);
  const value = useMemo(() => ({
    settings: s, resolved,
    set: (k, v) => setS(p => ({ ...p, [k]: v })),
    toggleTheme: () => setS(p => ({ ...p, theme: resolved === 'dark' ? 'light' : 'dark' })),
    reset: () => setS(DEFAULTS)
  }), [s, resolved]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
