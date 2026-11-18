import { useEffect, useState } from 'react';
import { X, Inbox, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { initials } from '../utils/format';

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => { if (!open) return; const h = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head"><h3>{title}</h3><button className="iconbtn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const TONES = { Pending: 'amber', Processing: 'blue', Completed: 'green', Cancelled: 'red', Approved: 'green', Rejected: 'red', 'stock-in': 'green', 'stock-out': 'red', OK: 'green', Low: 'amber', Out: 'red', Active: 'green', Inactive: 'red',
  admin: 'purple', warehouseManager: 'blue', supplier: 'amber', salesRepresentative: 'green' };
export const Badge = ({ status, label, pulse }) => <span className={`badge b-${TONES[status] || 'blue'} ${pulse ? 'pulse' : ''}`}>{label || status}</span>;

export function Avatar({ user, size = 38 }) {
  return user?.image
    ? <img className="avatar" src={user.image} alt="" style={{ width: size, height: size }} />
    : <span className="avatar" style={{ width: size, height: size, fontSize: size * .38 }}>{initials(user?.name)}</span>;
}

export function PageHead({ title, subtitle, children }) {
  return <div className="page-head"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="actions">{children}</div></div>;
}

export function CountUp({ value, prefix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start; const target = Number(value) || 0;
    const step = ts => { start ??= ts; const p = Math.min((ts - start) / 800, 1); setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{n.toLocaleString()}</>;
}

export function StatCard({ icon: Icon, label, value, prefix, tone = '', to }) {
  const inner = <><div className={`ico ${tone}`}><Icon size={22} /></div><div><b><CountUp value={value} prefix={prefix} /></b><span>{label}</span></div>{to && <ArrowUpRight className="go" size={17} />}</>;
  return to ? <Link to={to} className="card stat">{inner}</Link> : <div className="card stat">{inner}</div>;
}

export function Empty({ title = 'Nothing here yet', text, icon: Icon = Inbox, children }) {
  return <div className="empty"><Icon size={44} /><h4>{title}</h4>{text && <p>{text}</p>}{children}</div>;
}

export function Table({ columns, rows, loading, empty, onRow }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr>{columns.map(c => <th key={c.label} className={c.right ? 'right' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>
          {loading && Array.from({ length: 5 }).map((_, i) => <tr key={i}>{columns.map(c => <td key={c.label}><div className="skel" style={{ width: `${50 + (i * 13) % 40}%` }} /></td>)}</tr>)}
          {!loading && rows?.map((r, i) => (
            <tr key={r._id || i} className={onRow ? 'click' : ''} onClick={() => onRow?.(r)}>
              {columns.map(c => <td key={c.label} className={c.right ? 'right' : ''}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && !rows?.length && (empty || <Empty />)}
    </div>
  );
}

export const Thumb = ({ src, name }) => src ? <img className="thumb" src={src} alt="" /> : <span className="thumb" style={{ display: 'grid', placeItems: 'center', fontWeight: 800, color: 'var(--muted)' }}>{(name || '?')[0]}</span>;

export function LevelBar({ qty, limit, max }) {
  const pct = Math.min(100, max ? (qty / max) * 100 : Math.min(100, (qty / Math.max(limit * 3, 1)) * 100));
  const cls = qty === 0 || qty <= limit * .5 ? 'bad' : qty <= limit ? 'warn' : '';
  return <div className={`bar ${cls}`}><i style={{ width: `${Math.max(pct, qty ? 4 : 0)}%` }} /></div>;
}
