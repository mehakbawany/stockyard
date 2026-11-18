import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Moon, LogOut, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NAV, COMMON } from '../nav';

const ACCENTS = ['amber', 'teal', 'indigo', 'rose', 'lime'];
export default function CommandPalette({ open, onClose }) {
  const { user, logout } = useAuth(), { toggleTheme, set, settings } = useTheme(), nav = useNavigate();
  const [q, setQ] = useState(''), [sel, setSel] = useState(0), ref = useRef();
  const items = useMemo(() => [
    ...[...(NAV[user?.role] || []), ...COMMON].map(n => ({ label: `Go to ${n.label}`, icon: n.icon, hint: 'Page', run: () => nav(n.to) })),
    { label: 'Toggle dark / light theme', icon: Moon, hint: 'Action', run: toggleTheme },
    { label: 'Cycle accent colour', icon: Palette, hint: 'Action', run: () => set('accent', ACCENTS[(ACCENTS.indexOf(settings.accent) + 1) % ACCENTS.length]) },
    { label: 'Log out', icon: LogOut, hint: 'Action', run: () => { logout(); nav('/login'); } }
  ], [user, settings.accent]); // eslint-disable-line
  const list = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  if (!open) return null;
  const go = i => { onClose(); i?.run(); };
  const key = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, list.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') go(list[sel]);
    if (e.key === 'Escape') onClose();
  };
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal cmd">
        <input ref={ref} value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={key} placeholder="Type a page or action..." />
        <div className="cmd-list">
          {!list.length && <p className="muted" style={{ padding: 16 }}>No match for "{q}"</p>}
          {list.map((i, idx) => <button key={i.label} className={`cmd-item ${idx === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(idx)} onClick={() => go(i)}><i.icon size={18} />{i.label}<small>{i.hint}</small></button>)}
        </div>
      </div>
    </div>
  );
}
