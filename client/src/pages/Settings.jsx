import { Sun, Moon, Monitor, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useTheme } from '../context/ThemeContext';
import { PageHead } from '../components/ui';
import { beep } from '../utils/format';
import { confirmBox } from '../utils/alert';

const ACCENTS = { amber: '#f5a524', teal: '#14b8a6', indigo: '#6d7bff', rose: '#f43f7a', lime: '#84cc16' };
const THEMES = [['light', 'Light', Sun, '#eceef2', '#fff'], ['dark', 'Dark', Moon, '#0b0e13', '#141922'], ['system', 'System', Monitor, 'linear-gradient(90deg,#eceef2 50%,#0b0e13 50%)', '#888']];
const Row = ({ title, hint, on, onClick }) => <div className="setrow"><div><b>{title}</b><small>{hint}</small></div><button className={`switch ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on} aria-label={title} /></div>;

export default function Settings() {
  const { settings: s, set, reset } = useTheme();
  const clearNotifs = async () => { if (await confirmBox({ title: 'Clear all notifications?', text: 'This only affects your own inbox.', confirmText: 'Clear them', danger: false })) { await api.delete('/notifications'); toast.success('Notifications cleared'); } };
  return (
    <>
      <PageHead title="Settings" subtitle="Make StockYard feel like yours. Saved on this device." />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card"><h3>Appearance</h3>
          <div className="themecards">{THEMES.map(([k, l, I, a, b]) => (
            <button key={k} className={`themecard ${s.theme === k ? 'on' : ''}`} onClick={() => set('theme', k)}>
              <div className="mini" style={{ background: a }}><div style={{ width: '30%', background: '#10141b' }} /><div style={{ flex: 1, padding: 8 }}><div style={{ height: 8, width: '60%', background: b, borderRadius: 4 }} /></div></div>
              <b style={{ display: 'flex', gap: 6, alignItems: 'center' }}><I size={15} /> {l}</b></button>))}</div>
          <h4 style={{ margin: '22px 0 10px' }}>Accent colour</h4>
          <div style={{ display: 'flex', gap: 12 }}>{Object.entries(ACCENTS).map(([k, c]) => <button key={k} className={`swatch ${s.accent === k ? 'on' : ''}`} style={{ background: c }} onClick={() => set('accent', k)} aria-label={k} title={k} />)}</div>
          <div style={{ marginTop: 18 }}>
            <Row title="Compact tables" hint="Tighter rows to fit more on screen" on={s.density === 'compact'} onClick={() => set('density', s.density === 'compact' ? 'comfortable' : 'compact')} />
            <Row title="Animations" hint="Turn off for a calmer interface" on={s.motion} onClick={() => set('motion', !s.motion)} />
            <Row title="Collapse sidebar" hint="Icons only, more room for content" on={s.sidebarCollapsed} onClick={() => set('sidebarCollapsed', !s.sidebarCollapsed)} /></div></div>
        <div className="grid">
          <div className="card"><h3>Notifications</h3>
            <Row title="Auto-refresh alerts" hint="Check for new alerts every 20 seconds" on={s.autoRefresh} onClick={() => set('autoRefresh', !s.autoRefresh)} />
            <Row title="Alert sound" hint="Play a short chime for new alerts" on={s.sound} onClick={() => { set('sound', !s.sound); if (!s.sound) beep(); }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><button className="btn" onClick={() => toast('This is how alerts look', { icon: '🔔' })}>Preview toast</button><button className="btn" onClick={clearNotifs}><Trash2 size={15} /> Clear inbox</button></div></div>
          <div className="card"><h3>Shortcuts</h3>
            {[['Ctrl + K', 'Open the command palette'], ['Esc', 'Close dialogs'], ['Up / Down + Enter', 'Move through palette results']].map(([k, d]) => <div key={k} className="setrow"><div><span className="kbd">{k}</span></div><span className="muted">{d}</span></div>)}</div>
          <button className="btn" onClick={() => { reset(); toast.success('Settings reset'); }}><RotateCcw size={15} /> Reset to defaults</button>
        </div>
      </div>
    </>
  );
}
