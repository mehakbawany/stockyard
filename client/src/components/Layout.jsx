import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PanelLeftClose, Menu, Search, Sun, Moon, User, Settings, LogOut, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NAV, COMMON } from '../nav';
import { Avatar } from './ui';
import NotificationBell from './NotificationBell';
import CommandPalette from './CommandPalette';
import { ROLE_LABEL } from '../utils/format';
import api from '../api';

export default function Layout() {
  const { user, logout } = useAuth(), { resolved, toggleTheme, settings, set } = useTheme();
  const [mobile, setMobile] = useState(false), [cmd, setCmd] = useState(false), [menu, setMenu] = useState(false), [lowCount, setLowCount] = useState(0);
  const loc = useLocation(), nav = useNavigate();
  const items = NAV[user.role] || [];
  const title = [...items, ...COMMON].find(n => loc.pathname.startsWith(n.to))?.label || 'StockYard';
  const collapsed = settings.sidebarCollapsed;

  // sidebar badge = live count from the server (same query as the Low stock page), not a count of old notifications
  const canSeeLow = user.role === 'admin' || user.role === 'warehouseManager';
  const refreshLow = useCallback(() => { if (canSeeLow) api.get('/stock/low/count').then(r => setLowCount(r.data.count)).catch(() => {}); }, [canSeeLow]);
  useEffect(() => { refreshLow(); }, [refreshLow, loc.pathname]);

  useEffect(() => { setMobile(false); setMenu(false); }, [loc.pathname]);
  useEffect(() => {
    const h = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(c => !c); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Boxes size={22} /></div><span>StockYard</span></div>
        <nav className="nav">
          {items.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/orders' || n.to === '/dashboard'} title={n.label}>
              <n.icon size={19} /><span>{n.label}</span>{n.alert && lowCount > 0 && <em className="count" style={{ fontStyle: 'normal' }}>{lowCount}</em>}
            </NavLink>))}
          <div className="nav-sep">Account</div>
          {COMMON.map(n => <NavLink key={n.to} to={n.to} title={n.label}><n.icon size={19} /><span>{n.label}</span></NavLink>)}
        </nav>
        <div className="side-user"><Avatar user={user} size={36} /><div><b style={{ fontSize: 14 }}>{user.name}</b><small>{ROLE_LABEL[user.role]}</small></div></div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="iconbtn menu-btn" onClick={() => setMobile(true)} aria-label="Open menu"><Menu size={19} /></button>
          <button className="iconbtn no-print" style={{ display: window.innerWidth < 900 ? 'none' : 'grid' }} onClick={() => set('sidebarCollapsed', !collapsed)} aria-label="Collapse sidebar"><PanelLeftClose size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '.2s' }} /></button>
          <h2>{title}</h2>
          <button className="searchbtn" onClick={() => setCmd(true)}><Search size={17} /><span>Search pages & actions</span><kbd>Ctrl K</kbd></button>
          <button className="iconbtn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">{resolved === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
          <NotificationBell onCount={refreshLow} />
          <div style={{ position: 'relative' }}>
            <button className="iconbtn" style={{ padding: 0, overflow: 'hidden' }} onClick={() => setMenu(m => !m)} aria-label="Account menu"><Avatar user={user} size={38} /></button>
            {menu && <div className="pop menu" style={{ width: 230 }}>
              <div style={{ padding: '10px 12px' }}><b>{user.name}</b><div className="muted" style={{ fontSize: 13 }}>{user.email}</div></div>
              <button className="menuitem" onClick={() => nav('/profile')}><User size={17} /> Edit profile</button>
              <button className="menuitem" onClick={() => nav('/settings')}><Settings size={17} /> Settings</button>
              <button className="menuitem" onClick={() => { logout(); nav('/login'); }}><LogOut size={17} /> Log out</button>
            </div>}
          </div>
        </header>
        <main className="content"><div key={loc.pathname} className="page"><Outlet /></div></main>
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}
