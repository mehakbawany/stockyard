import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Boxes, Eye, EyeOff, ShieldAlert, Compass, PackageCheck, BellRing, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

function Hero() {
  return (
    <div className="auth-hero">
      <div className="brand"><div className="brand-mark"><Boxes size={22} /></div><span>StockYard</span></div>
      <div>
        <h1>Every unit, in the right place.</h1>
        <p>Track stock across warehouses, approve supplier shipments and ship sales orders without ever selling what you don't have.</p>
        <div style={{ display: 'flex', gap: 22, marginTop: 28, color: '#aab3c4', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', gap: 8 }}><PackageCheck size={18} /> Live stock</span><span style={{ display: 'flex', gap: 8 }}><BellRing size={18} /> Smart alerts</span><span style={{ display: 'flex', gap: 8 }}><Palette size={18} /> Your theme</span>
        </div>
      </div>
      <svg className="crates" width="360" height="360" viewBox="0 0 360 360" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" opacity=".55">
        <path d="M180 40l120 60v120l-120 60-120-60V100z"/><path d="M60 100l120 60 120-60M180 160v120"/><path d="M120 70l120 60v60"/>
      </svg>
      <small style={{ color: '#5d687b' }}>MERN hackathon build with ImageKit uploads</small>
    </div>
  );
}

const DEMOS = [['Admin', 'admin@ims.com', 'Admin@123'], ['Manager', 'manager@ims.com', 'Manager@123'], ['Supplier', 'supplier@ims.com', 'Supplier@123'], ['Sales rep', 'sales@ims.com', 'Sales@123']];

export function Login() {
  const { user, login } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' }), [show, setShow] = useState(false), [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const go = async (email, password) => {
    setBusy(true);
    try { const u = await login(email, password); toast.success(`Welcome back, ${u.name.split(' ')[0]}!`); nav('/dashboard'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="auth"><Hero />
      <div className="auth-form"><div className="box">
        <h2>Sign in</h2><p className="muted" style={{ marginTop: 0 }}>Pick up where you left off.</p>
        <form onSubmit={e => { e.preventDefault(); go(f.email, f.password); }}>
          <div className="field"><label>Email</label><input className="input" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="you@company.com" /></div>
          <div className="field"><label>Password</label>
            <div className="inputicon"><input className="input" style={{ paddingLeft: 13 }} type={show ? 'text' : 'password'} required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: 9, background: 'none', border: 0, color: 'var(--muted)' }}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="muted" style={{ textAlign: 'center' }}>New here? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>Create an account</Link></p>
        <div className="muted" style={{ fontSize: 13, marginTop: 22 }}>Demo accounts (run <span className="mono">npm run seed</span> first) - tap to sign in:</div>
        <div className="demo">{DEMOS.map(([n, e, p]) => <button key={n} type="button" onClick={() => go(e, p)}><b>{n}</b><span className="muted">{e}</span></button>)}</div>
      </div></div>
    </div>
  );
}

const strength = p => [p.length >= 6, /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
export function Register() {
  const { register } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', role: 'salesRepresentative', companyName: '' }), [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value }), sc = strength(f.password);
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try { await register(f); toast.success('Account created'); nav('/dashboard'); } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <div className="auth"><Hero />
      <div className="auth-form"><div className="box">
        <h2>Create your account</h2><p className="muted" style={{ marginTop: 0 }}>Admin accounts are created by an existing admin.</p>
        <form onSubmit={submit}>
          <div className="field"><label>Full name</label><input className="input" required value={f.name} onChange={set('name')} /></div>
          <div className="row"><div className="field"><label>Email</label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
            <div className="field"><label>Phone</label><input className="input" value={f.phone} onChange={set('phone')} /></div></div>
          <div className="field"><label>I am a...</label>
            <select className="input" value={f.role} onChange={set('role')}><option value="salesRepresentative">Sales representative</option><option value="warehouseManager">Warehouse manager</option><option value="supplier">Supplier</option></select></div>
          {f.role === 'supplier' && <div className="field"><label>Company name</label><input className="input" value={f.companyName} onChange={set('companyName')} /></div>}
          <div className="field"><label>Password</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} />
            <div className="strength">{[0, 1, 2, 3].map(i => <i key={i} className={i < sc ? 'on' : ''} />)}</div>
            <small className="muted">{['Too short', 'Weak', 'Okay', 'Good', 'Strong'][sc]} - add capitals, numbers and symbols</small></div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="muted" style={{ textAlign: 'center' }}>Already registered? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Sign in</Link></p>
      </div></div>
    </div>
  );
}

const Center = ({ icon: I, title, text }) => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
    <div><I size={64} style={{ color: 'var(--accent)' }} /><h1 style={{ fontSize: 40, margin: '12px 0 6px' }}>{title}</h1><p className="muted">{text}</p>
      <Link to="/dashboard" className="btn primary" style={{ marginTop: 14 }}>Back to dashboard</Link></div>
  </div>
);
export const Unauthorized = () => <Center icon={ShieldAlert} title="Access denied" text="Your role doesn't have permission to open this page." />;
export const NotFound = () => <Center icon={Compass} title="Page not found" text="That address doesn't exist in StockYard." />;
