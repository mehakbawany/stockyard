import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { Modal, Badge, Avatar, PageHead, Table } from '../components/ui';
import ImageUpload from '../components/ImageUpload';
import { confirmBox, successBox } from '../utils/alert';
import { ROLE_LABEL, dateFmt, exportCSV } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'salesRepresentative', assignedWarehouses: [], companyName: '', isActive: true, image: '', imageFileId: '' };

export default function Users() {
  const { user: me } = useAuth();
  const [q, setQ] = useState(''), [role, setRole] = useState('');
  const { data, loading, reload } = useFetch('/users', { search: q, role });
  const { data: whs } = useFetch('/warehouses');
  const [form, setForm] = useState(null), [busy, setBusy] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const open = u => setForm(u ? { ...EMPTY, ...u, password: '', assignedWarehouses: (u.assignedWarehouses || []).map(w => w._id || w) } : { ...EMPTY });
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { ...form }; if (!body.password) delete body.password;
      form._id ? await api.put(`/users/${form._id}`, body) : await api.post('/users', body);
      setForm(null); reload(); successBox(form._id ? 'User updated' : 'User created');
    } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const remove = async u => {
    if (!(await confirmBox({ title: `Delete ${u.name}?`, text: 'Their profile and image will be removed permanently.', confirmText: 'Delete user' }))) return;
    try { await api.delete(`/users/${u._id}`); toast.success('User deleted'); reload(); } catch (er) { toast.error(errMsg(er)); }
  };
  const toggle = async u => { try { await api.put(`/users/${u._id}`, { isActive: !u.isActive }); toast.success(u.isActive ? 'Account deactivated' : 'Account activated'); reload(); } catch (er) { toast.error(errMsg(er)); } };

  return (
    <>
      <PageHead title="Users" subtitle="Create accounts, assign roles and control access.">
        <button className="btn" onClick={() => exportCSV('users.csv', (data || []).map(u => ({ name: u.name, email: u.email, role: u.role, phone: u.phone, active: u.isActive })))}><Download size={16} /> Export</button>
        <button className="btn primary" onClick={() => open()}><Plus size={17} /> Add user</button>
      </PageHead>
      <div className="toolbar">
        <div className="inputicon grow"><Search size={18} /><input className="input" placeholder="Search name, email or phone" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select className="input" value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <Table loading={loading} rows={data} columns={[
        { label: 'User', render: u => <div className="cell"><Avatar user={u} size={40} /><div><b>{u.name}</b><small>{u.email}</small></div></div> },
        { label: 'Role', render: u => <Badge status={u.role} label={ROLE_LABEL[u.role]} /> },
        { label: 'Warehouses', render: u => u.assignedWarehouses?.map(w => w.name).join(', ') || <span className="muted">-</span> },
        { label: 'Joined', render: u => dateFmt(u.createdAt) },
        { label: 'Active', render: u => <button className={`switch ${u.isActive ? 'on' : ''}`} disabled={u._id === me._id} onClick={() => toggle(u)} aria-label="Toggle active" /> },
        { label: '', right: true, render: u => <div className="actions-cell"><button className="btn sm" onClick={() => open(u)}><Pencil size={14} /></button><button className="btn sm danger" disabled={u._id === me._id} onClick={() => remove(u)}><Trash2 size={14} /></button></div> }
      ]} />
      <Modal open={!!form} onClose={() => setForm(null)} title={form?._id ? 'Edit user' : 'Add user'} wide>
        {form && <form onSubmit={save}>
          <ImageUpload shape="circle" label="Profile picture" value={form.image} onChange={v => setForm({ ...form, image: v.url, imageFileId: v.fileId })} onRemove={() => setForm({ ...form, image: '', imageFileId: '', removeImage: true })} />
          <div className="row" style={{ marginTop: 16 }}>
            <div className="field"><label>Full name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div></div>
          <div className="row">
            <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div className="field"><label>{form._id ? 'New password (optional)' : 'Password'}</label><input className="input" type="password" minLength={6} required={!form._id} value={form.password} onChange={set('password')} /></div></div>
          <div className="row">
            <div className="field"><label>Role</label><select className="input" value={form.role} onChange={set('role')}>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {form.role === 'supplier' && <div className="field"><label>Company</label><input className="input" value={form.companyName} onChange={set('companyName')} /></div>}</div>
          {form.role === 'warehouseManager' && <div className="field"><label>Assigned warehouses</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(whs || []).map(w => { const on = form.assignedWarehouses.includes(w._id); return <button type="button" key={w._id} className={`btn sm ${on ? 'primary' : ''}`} onClick={() => setForm({ ...form, assignedWarehouses: on ? form.assignedWarehouses.filter(x => x !== w._id) : [...form.assignedWarehouses, w._id] })}>{w.name}</button>; })}</div></div>}
          <div className="modal-foot"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save user'}</button></div>
        </form>}
      </Modal>
    </>
  );
}
