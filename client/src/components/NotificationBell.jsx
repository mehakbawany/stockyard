import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Trash2, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';
import { timeAgo, beep } from '../utils/format';

const ICON = { warning: [AlertTriangle, 'b-amber'], success: [CheckCircle2, 'b-green'], danger: [XCircle, 'b-red'], info: [Info, 'b-blue'] };

export default function NotificationBell({ onCount }) {
  const [open, setOpen] = useState(false), [data, setData] = useState({ items: [], unread: 0 });
  const seen = useRef(null), box = useRef(), nav = useNavigate(), { settings } = useTheme();

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/notifications'); setData(d); onCount?.(d.items);
      const ids = new Set(d.items.map(n => n._id));
      if (seen.current) d.items.filter(n => !seen.current.has(n._id) && !n.read).slice(0, 3).forEach(n => {
        toast(`${n.title}: ${n.message}`, { icon: n.type === 'warning' ? '⚠️' : n.type === 'danger' ? '🚨' : n.type === 'success' ? '✅' : '🔔', duration: 5000 });
        if (settings.sound) beep();
      });
      seen.current = ids;
    } catch { /* ignore */ }
  }, [settings.sound, onCount]);

  useEffect(() => { load(); if (!settings.autoRefresh) return; const t = setInterval(load, 20000); return () => clearInterval(t); }, [load, settings.autoRefresh]);
  useEffect(() => { const h = e => box.current && !box.current.contains(e.target) && setOpen(false); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const click = async n => { setOpen(false); if (!n.read) { await api.put(`/notifications/${n._id}/read`); load(); } if (n.link) nav(n.link); };
  const readAll = async () => { await api.put('/notifications/read-all'); load(); };
  const clear = async () => { await api.delete('/notifications'); load(); };

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button className="iconbtn" onClick={() => setOpen(o => !o)} aria-label="Notifications"><Bell size={19} />{data.unread > 0 && <span className="badge-dot">{data.unread}</span>}</button>
      {open && (
        <div className="pop">
          <div className="pop-head"><h4>Notifications</h4>
            <button className="btn sm ghost" onClick={readAll} title="Mark all as read"><CheckCheck size={15} /></button>
            <button className="btn sm ghost" onClick={clear} title="Clear all"><Trash2 size={15} /></button></div>
          <div className="pop-list">
            {!data.items.length && <div className="empty" style={{ padding: 32 }}><Bell size={32} /><p>You're all caught up.</p></div>}
            {data.items.map(n => { const [Ic, cls] = ICON[n.type] || ICON.info; return (
              <button key={n._id} className={`nitem ${n.read ? '' : 'unread'}`} onClick={() => click(n)}>
                <span className={`dot ${cls}`}><Ic size={17} /></span>
                <span><b style={{ display: 'block', fontSize: 14 }}>{n.title}</b><span className="muted" style={{ fontSize: 13 }}>{n.message}</span><small className="muted" style={{ display: 'block', marginTop: 2 }}>{timeAgo(n.createdAt)}</small></span>
              </button>); })}
          </div>
        </div>
      )}
    </div>
  );
}
