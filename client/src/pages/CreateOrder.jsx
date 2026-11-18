import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { PageHead, Thumb, Empty, CountUp } from '../components/ui';
import { successBox } from '../utils/alert';
import { money } from '../utils/format';

export default function CreateOrder() {
  const nav = useNavigate(), { state } = useLocation();
  const { data: whs } = useFetch('/warehouses');
  const [wh, setWh] = useState(''), [cust, setCust] = useState({ customerName: '', customerPhone: '' }), [cart, setCart] = useState({}), [q, setQ] = useState(''), [busy, setBusy] = useState(false);
  const { data: stock, loading } = useFetch('/stock', wh ? { warehouse: wh } : { warehouse: 'none' });
  useEffect(() => { if (whs?.length && !wh) setWh(whs[0]._id); }, [whs]); // eslint-disable-line
  useEffect(() => { setCart({}); }, [wh]);
  useEffect(() => { if (state?.product && stock) { const r = stock.find(s => s.product._id === state.product); if (r && !cart[r.product._id]) setCart(c => ({ ...c, [r.product._id]: 1 })); } }, [stock]); // eslint-disable-line

  const items = (stock || []).filter(s => s.quantity > 0);
  const shown = items.filter(s => !q || s.product.name.toLowerCase().includes(q.toLowerCase()) || s.product.sku.toLowerCase().includes(q.toLowerCase()));
  const lines = Object.entries(cart).map(([id, qty]) => ({ row: items.find(s => s.product._id === id), qty })).filter(l => l.row);
  const total = lines.reduce((s, l) => s + l.qty * l.row.product.price, 0);
  const change = (id, d, max) => setCart(c => { const n = (c[id] || 0) + d; if (n > max) { toast.error(`Only ${max} available`); return c; } const x = { ...c }; n <= 0 ? delete x[id] : (x[id] = n); return x; });

  const submit = async () => {
    if (!lines.length) return toast.error('Add at least one product');
    setBusy(true);
    try {
      const { data } = await api.post('/orders', { ...cust, warehouse: wh, products: lines.map(l => ({ product: l.row.product._id, quantity: l.qty })) });
      await successBox('Order placed', data.orderNumber); nav(`/orders/${data._id}`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="New sales order" subtitle="Pick a warehouse, add products and check availability live." />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(300px,1fr)' }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row3 row">
              <div className="field"><label>Customer name</label><input className="input" value={cust.customerName} onChange={e => setCust({ ...cust, customerName: e.target.value })} /></div>
              <div className="field"><label>Customer phone</label><input className="input" value={cust.customerPhone} onChange={e => setCust({ ...cust, customerPhone: e.target.value })} /></div>
              <div className="field"><label>Ship from</label><select className="input" value={wh} onChange={e => setWh(e.target.value)}>{(whs || []).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select></div></div>
          </div>
          <div className="toolbar"><div className="inputicon grow"><Search size={18} /><input className="input" placeholder="Search products in this warehouse" value={q} onChange={e => setQ(e.target.value)} /></div></div>
          {loading ? <div className="card"><div className="skel" style={{ height: 120 }} /></div> : !shown.length ? <div className="card"><Empty title="No products available" text="This warehouse has nothing in stock for that search." /></div> :
            <div className="pgrid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>{shown.map(s => { const n = cart[s.product._id] || 0; return (
              <div key={s._id} className="card pcard"><div className="pimg" style={{ aspectRatio: '16/10' }}>{s.product.imageUrl ? <img src={s.product.imageUrl} alt="" /> : s.product.name[0]}</div>
                <div className="pbody"><b>{s.product.name}</b><div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="price" style={{ fontSize: 16 }}>{money(s.product.price)}</span><small className="mono muted">{s.quantity} avail.</small></div>
                  {n ? <div className="qty"><button onClick={() => change(s.product._id, -1, s.quantity)}><Minus size={14} /></button><span>{n}</span><button onClick={() => change(s.product._id, 1, s.quantity)}><Plus size={14} /></button></div>
                    : <button className="btn sm primary" onClick={() => change(s.product._id, 1, s.quantity)}><Plus size={14} /> Add</button>}</div></div>); })}</div>}
        </div>
        <div className="card cart">
          <h3><ShoppingCart size={18} /> Order summary</h3>
          {!lines.length ? <Empty title="Cart is empty" text="Add products from the left." icon={ShoppingCart} /> : lines.map(l => (
            <div key={l.row._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <Thumb src={l.row.product.imageUrl} name={l.row.product.name} /><div style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block' }}>{l.row.product.name}</b><small className="muted">{l.qty} x {money(l.row.product.price)}</small></div>
              <b>{money(l.qty * l.row.product.price)}</b><button className="btn sm ghost" onClick={() => change(l.row.product._id, -l.qty, l.row.quantity)}><Trash2 size={14} /></button></div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', alignItems: 'baseline' }}><span className="muted">Grand total</span><b style={{ fontSize: 28, fontFamily: 'var(--display)' }}><CountUp value={total} prefix="Rs. " /></b></div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !lines.length || !cust.customerName.trim()} onClick={submit}>{busy ? 'Placing...' : 'Place order'}</button>
          {!cust.customerName.trim() && lines.length > 0 && <small className="muted">Enter the customer name to continue.</small>}
        </div>
      </div>
    </>
  );
}
