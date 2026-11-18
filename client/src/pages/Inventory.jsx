import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ArrowDownToLine, ArrowUpFromLine, Repeat, Download } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { Modal, Badge, PageHead, Table, Thumb, LevelBar } from '../components/ui';
import { successBox } from '../utils/alert';
import { exportCSV } from '../utils/format';

const MODES = { in: ['Receive stock', 'stock/in', ArrowDownToLine], out: ['Remove stock', 'stock/out', ArrowUpFromLine], transfer: ['Transfer stock', 'stock/transfer', Repeat] };

export default function Inventory() {
  const [sp, setSp] = useSearchParams();
  const [f, setF] = useState({ search: '', level: '', warehouse: sp.get('warehouse') || '' });
  const { data, loading, reload } = useFetch('/stock', f);
  const { data: whs } = useFetch('/warehouses'), { data: prods } = useFetch('/products');
  const [m, setM] = useState(null), [busy, setBusy] = useState(false);
  const open = (mode, row) => setM({ mode, product: row?.product._id || '', warehouse: row?.warehouse._id || f.warehouse || '', toWarehouse: '', quantity: '', note: '' });
  const avail = m && (data || []).find(r => r.product._id === m.product && r.warehouse._id === m.warehouse)?.quantity;

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const body = m.mode === 'transfer' ? { product: m.product, fromWarehouse: m.warehouse, toWarehouse: m.toWarehouse, quantity: Number(m.quantity), note: m.note } : { product: m.product, warehouse: m.warehouse, quantity: Number(m.quantity), note: m.note };
      await api.post(`/${MODES[m.mode][1]}`, body);
      setM(null); reload(); successBox(m.mode === 'in' ? 'Stock received' : m.mode === 'out' ? 'Stock removed' : 'Transfer complete');
    } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Inventory" subtitle="Live quantities per warehouse. Every change is logged as a transaction.">
        <button className="btn" onClick={() => exportCSV('inventory.csv', (data || []).map(r => ({ product: r.product.name, sku: r.product.sku, warehouse: r.warehouse.name, quantity: r.quantity })))}><Download size={16} /> Export</button>
        <button className="btn" onClick={() => open('transfer')}><Repeat size={16} /> Transfer</button>
        <button className="btn" onClick={() => open('out')}><ArrowUpFromLine size={16} /> Remove stock</button>
        <button className="btn primary" onClick={() => open('in')}><ArrowDownToLine size={16} /> Receive stock</button>
      </PageHead>
      <div className="toolbar">
        <div className="inputicon grow"><Search size={18} /><input className="input" placeholder="Search product or SKU" value={f.search} onChange={e => setF({ ...f, search: e.target.value })} /></div>
        <select className="input" value={f.warehouse} onChange={e => { setF({ ...f, warehouse: e.target.value }); setSp(e.target.value ? { warehouse: e.target.value } : {}); }}><option value="">All warehouses</option>{(whs || []).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select>
        <select className="input" value={f.level} onChange={e => setF({ ...f, level: e.target.value })}><option value="">Any level</option><option value="ok">Healthy</option><option value="low">Low</option><option value="out">Out of stock</option></select>
      </div>
      <Table loading={loading} rows={data} columns={[
        { label: 'Product', render: r => <div className="cell"><Thumb src={r.product.imageUrl} name={r.product.name} /><div><b>{r.product.name}</b><small className="mono">{r.product.sku}</small></div></div> },
        { label: 'Warehouse', render: r => r.warehouse.name },
        { label: 'Quantity', render: r => <div style={{ minWidth: 130 }}><b className="mono">{r.quantity}</b> <span className="muted">/ limit {r.product.lowStockLimit}</span><LevelBar qty={r.quantity} limit={r.product.lowStockLimit} /></div> },
        { label: 'Status', render: r => r.quantity === 0 ? <Badge status="Out" label="Out of stock" pulse /> : r.low ? <Badge status="Low" label="Low" pulse /> : <Badge status="OK" label="Healthy" /> },
        { label: '', right: true, render: r => <div className="actions-cell"><button className="btn sm" onClick={() => open('in', r)}><ArrowDownToLine size={14} /></button><button className="btn sm" onClick={() => open('out', r)}><ArrowUpFromLine size={14} /></button></div> }
      ]} />
      <Modal open={!!m} onClose={() => setM(null)} title={m ? MODES[m.mode][0] : ''}>
        {m && <form onSubmit={submit}>
          <div className="field"><label>Product</label><select className="input" required value={m.product} onChange={e => setM({ ...m, product: e.target.value })}><option value="">Select product</option>{(prods || []).map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}</select></div>
          <div className="row"><div className="field"><label>{m.mode === 'transfer' ? 'From warehouse' : 'Warehouse'}</label><select className="input" required value={m.warehouse} onChange={e => setM({ ...m, warehouse: e.target.value })}><option value="">Select</option>{(whs || []).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
            {m.mode === 'transfer' && <div className="field"><label>To warehouse</label><select className="input" required value={m.toWarehouse} onChange={e => setM({ ...m, toWarehouse: e.target.value })}><option value="">Select</option>{(f.warehouse || true) && (whs || []).filter(w => w._id !== m.warehouse).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select></div>}</div>
          {m.product && m.warehouse && m.mode !== 'in' && <p className="muted" style={{ marginTop: -6 }}>Available here: <b className="mono">{avail ?? 0}</b></p>}
          <div className="field"><label>Quantity</label><input className="input" type="number" min="1" step="1" required value={m.quantity} onChange={e => setM({ ...m, quantity: e.target.value })} /></div>
          <div className="field"><label>Note (optional)</label><input className="input" value={m.note} onChange={e => setM({ ...m, note: e.target.value })} placeholder="e.g. Delivery #4521" /></div>
          <div className="modal-foot"><button type="button" className="btn" onClick={() => setM(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Working...' : 'Confirm'}</button></div>
        </form>}
      </Modal>
    </>
  );
}
