import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, ShieldCheck, Calendar, Building2, Lock, Save } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui';
import ImageUpload from '../components/ImageUpload';
import { successBox } from '../utils/alert';
import { ROLE_LABEL, dateFmt, initials } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth(), isSup = user.role === 'supplier';
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', companyName: user.companyName || '', address: user.address || '' });
  const [img, setImg] = useState({ url: user.image, fileId: '' , removed: false });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' }), [busy, setBusy] = useState(false);

  // make sure assigned warehouses arrive populated (names, not raw ids)
  useEffect(() => { api.get('/auth/me').then(r => setUser(r.data)).catch(() => {}); }, []); // eslint-disable-line

  const save = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { ...f }; if (img.fileId) body.imageFileId = img.fileId; if (img.removed) body.removeImage = true;
      const { data } = await api.put(`/users/${user._id}`, body);
      setUser({ ...user, ...data }); setImg({ url: data.image, fileId: '', removed: false }); successBox('Profile saved');
    } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const changePw = async e => {
    e.preventDefault();
    try { await api.put('/auth/password', pw); setPw({ currentPassword: '', newPassword: '' }); successBox('Password updated'); } catch (er) { toast.error(errMsg(er)); }
  };

  return (
    <div className="grid g-main" style={{ alignItems: 'start' }}>
      <div className="grid">
        <div className="card" style={{ padding: 0 }}>
          <div className="profile-cover" />
          <div className="profile-head">
            <ImageUpload variant="avatar" label={isSup ? 'Change company logo' : 'Change photo'} fallback={initials(user.name)} value={img.removed ? '' : img.url}
              onChange={v => setImg({ url: v.url, fileId: v.fileId, removed: false })} onRemove={() => setImg({ url: '', fileId: '', removed: true })} />
            <div className="profile-id"><h2>{user.name}</h2><span className="muted">{user.email}</span></div>
            <Badge status={user.role} label={ROLE_LABEL[user.role]} />
          </div>
          <form onSubmit={save} style={{ padding: '4px var(--pad) var(--pad)' }}>
            <div className="row"><div className="field"><label>Full name</label><input className="input" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div></div>
            {isSup && <div className="row"><div className="field"><label>Company</label><input className="input" value={f.companyName} onChange={e => setF({ ...f, companyName: e.target.value })} /></div>
              <div className="field"><label>Address</label><input className="input" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div></div>}
            <div className="modal-foot"><button className="btn primary" disabled={busy}><Save size={16} /> {busy ? 'Saving...' : 'Save changes'}</button></div>
          </form>
        </div>
        <form className="card" onSubmit={changePw}><h3><Lock size={18} /> Change password</h3>
          <div className="row"><div className="field"><label>Current password</label><input className="input" type="password" required value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} /></div>
            <div className="field"><label>New password</label><input className="input" type="password" minLength={6} required value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} /></div></div>
          <button className="btn">Update password</button></form>
      </div>
      <div className="card"><h3>Account</h3>
        {[[Mail, user.email], [Phone, user.phone || 'No phone added'], [ShieldCheck, <Badge status={user.role} label={ROLE_LABEL[user.role]} />], [Calendar, `Member since ${dateFmt(user.createdAt)}`], ...(isSup ? [[Building2, user.companyName || 'No company set']] : [])].map(([I, v], i) =>
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 0 }}><I size={18} className="muted" /><span>{v}</span></div>)}
        {user.role === 'warehouseManager' && <><h3 style={{ marginTop: 18 }}>Assigned warehouses</h3>{user.assignedWarehouses?.length ? user.assignedWarehouses.map(w => <div key={w._id || w} className="badge b-blue" style={{ margin: '0 6px 6px 0' }}>{w.name || w}</div>) : <p className="muted">None yet.</p>}</>}
      </div>
    </div>
  );
}
