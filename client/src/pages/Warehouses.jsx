import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, MapPin, Boxes, UserRound } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { Modal, PageHead, Empty, Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { confirmBox, successBox } from '../utils/alert';

const EMPTY = { name: '', location: '', capacity: 1000, manager: '' };
export default function Warehouses() {
  const { user } = useAuth(), isAdmin = user.role === 'admin', nav = useNavigate();
  const { data, loading, reload } = useFetch('/warehouses');
  const { data: users } = useFetch(isAdmin ? '/users' : '/auth/me', isAdmin ? { role: 'warehouseManager' } : undefined);
  const [form, setForm] = useState(null), [busy, setBusy] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try { form._id ? await api.put(`/warehouses/${form._id}`, form) : await api.post('/warehouses', form); setForm(null); reload(); successBox(form._id ? 'Warehouse updated' : 'Warehouse created'); }
    catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const remove = async w => {
    if (!(await confirmBox({ title: `Delete ${w.name}?`, text: 'Warehouses that still hold stock cannot be deleted.', confirmText: 'Delete warehouse' }))) return;
    try { await api.delete(`/warehouses/${w._id}`); toast.success('Warehouse deleted'); reload(); } catch (er) { toast.error(errMsg(er)); }
  };
  return (
    <>
      <PageHead title={isAdmin ? 'Warehouses' : 'My warehouses'} subtitle="Capacity, utilisation and who runs each site.">
        {isAdmin && <button className="btn primary" onClick={() => setForm({ ...EMPTY })}><Plus size={17} /> Add warehouse</button>}
      </PageHead>
      {loading ? <div className="grid g3">{[1, 2, 3].map(i => <div key={i} className="card"><div className="skel" style={{ height: 150 }} /></div>)}</div>
        : !data?.length ? <div className="card"><Empty title="No warehouses" text={isAdmin ? 'Add your first warehouse.' : 'An admin has not assigned a warehouse to you yet.'} /></div>
        : <div className="grid g3">{data.map(w => { const pct = w.capacity ? Math.min(100, w.used / w.capacity * 100) : 0; return (
          <div key={w._id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}><div><h3 style={{ margin: 0 }}>{w.name}</h3><div className="muted"><MapPin size={14} /> {w.location}</div></div>
              {isAdmin && <div className="actions-cell" style={{ marginLeft: 'auto' }}><button className="btn sm" onClick={() => setForm({ ...w, manager: w.manager?._id || '' })}><Pencil size={14} /></button><button className="btn sm danger" onClick={() => remove(w)}><Trash2 size={14} /></button></div>}</div>
            <div style={{ margin: '18px 0 6px', display: 'flex', justifyContent: 'space-between' }}><span className="muted">Capacity used</span><b className="mono">{w.used} / {w.capacity || '∞'}</b></div>
            <div className={`bar ${pct > 90 ? 'bad' : pct > 70 ? 'warn' : 'acc'}`}><i style={{ width: `${pct}%` }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              {w.manager ? <><Avatar user={w.manager} size={30} /><small>{w.manager.name}</small></> : <small className="muted"><UserRound size={14} /> No manager</small>}
              <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => nav(`/inventory?warehouse=${w._id}`)}><Boxes size={14} /> {w.productCount} products</button></div>
          </div>); })}</div>}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?._id ? 'Edit warehouse' : 'Add warehouse'}>
        {form && <form onSubmit={save}>
          <div className="field"><label>Name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Location</label><input className="input" required value={form.location} onChange={set('location')} /></div>
          <div className="row"><div className="field"><label>Capacity (units)</label><input className="input" type="number" min="0" value={form.capacity} onChange={set('capacity')} /></div>
            <div className="field"><label>Manager</label><select className="input" value={form.manager} onChange={set('manager')}><option value="">Unassigned</option>{(users || []).map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select></div></div>
          <div className="modal-foot"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save warehouse'}</button></div>
        </form>}
      </Modal>
    </>
  );
}
