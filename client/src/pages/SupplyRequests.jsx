import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Truck } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { Modal, Badge, PageHead, Table, Thumb, Empty } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { reviewBox, successBox, errorBox } from '../utils/alert';
import { dateTime } from '../utils/format';

const TABS = ['', 'Pending', 'Approved', 'Rejected'];
export default function SupplyRequests() {
  const { user } = useAuth(), isSupplier = user.role === 'supplier';
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useFetch('/supply-requests', { status }), { data: all } = useFetch('/supply-requests');
  const { data: prods } = useFetch(isSupplier ? '/products' : '/auth/me'), { data: whs } = useFetch('/warehouses');
  const [form, setForm] = useState(null), [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try { await api.post('/supply-requests', { ...form, quantity: Number(form.quantity) }); setForm(null); reload(); successBox('Request submitted', 'You will be notified once it is reviewed.'); }
    catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const review = async (r, approve) => {
    const v = await reviewBox({ title: `${approve ? 'Approve' : 'Reject'} ${r.quantity} x ${r.product?.name}?`, approve });
    if (!v) return;
    try { await api.put(`/supply-requests/${r._id}/status`, { status: approve ? 'Approved' : 'Rejected', ...v }); successBox(approve ? 'Request approved' : 'Request rejected'); reload(); }
    catch (er) { errorBox('Could not update request', errMsg(er)); }
  };
  const count = t => t ? (all || []).filter(r => r.status === t).length : (all || []).length;

  return (
    <>
      <PageHead title="Supply requests" subtitle={isSupplier ? 'Offer stock to a warehouse and follow its review.' : 'Review what suppliers want to deliver.'}>
        {isSupplier && <button className="btn primary" onClick={() => setForm({ product: '', warehouse: '', quantity: '', note: '' })}><Plus size={17} /> New request</button>}
      </PageHead>
      <div className="toolbar"><div className="seg">{TABS.map(t => <button key={t} className={status === t ? 'on' : ''} onClick={() => setStatus(t)}>{t || 'All'} <span className="muted">{count(t)}</span></button>)}</div></div>
      <Table loading={loading} rows={data} empty={<Empty icon={Truck} title="No requests" text={isSupplier ? 'Submit your first supply request.' : 'Nothing to review.'} />} columns={[
        { label: 'Product', render: r => <div className="cell"><Thumb src={r.product?.imageUrl} name={r.product?.name} /><div><b>{r.product?.name}</b><small className="mono">{r.product?.sku}</small></div></div> },
        ...(!isSupplier ? [{ label: 'Supplier', render: r => r.supplier?.companyName || r.supplier?.name }] : []),
        { label: 'Warehouse', render: r => r.warehouse?.name }, { label: 'Qty', render: r => <b className="mono">{r.quantity}</b> },
        { label: 'Submitted', render: r => dateTime(r.createdAt) }, { label: 'Status', render: r => <Badge status={r.status} /> },
        { label: 'Review', render: r => <span className="muted">{r.reviewNote || (r.reviewedBy ? `by ${r.reviewedBy.name}` : r.note || '-')}</span> },
        ...(!isSupplier ? [{ label: '', right: true, render: r => r.status === 'Pending' ? <div className="actions-cell"><button className="btn sm primary" onClick={() => review(r, true)}><Check size={14} /> Approve</button><button className="btn sm danger" onClick={() => review(r, false)}><X size={14} /></button></div> : null }] : [])
      ]} />
      <Modal open={!!form} onClose={() => setForm(null)} title="New supply request">
        {form && <form onSubmit={submit}>
          <div className="field"><label>Product</label><select className="input" required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}><option value="">Select one of your products</option>{(Array.isArray(prods) ? prods : []).map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}</select></div>
          <div className="row"><div className="field"><label>Deliver to</label><select className="input" required value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value })}><option value="">Select warehouse</option>{(whs || []).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
            <div className="field"><label>Quantity</label><input className="input" type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div></div>
          <div className="field"><label>Note</label><textarea className="input" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Delivery timeline, pricing, batch info..." /></div>
          <div className="modal-foot"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Sending...' : 'Submit request'}</button></div>
        </form>}
      </Modal>
    </>
  );
}
