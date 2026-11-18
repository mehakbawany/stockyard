import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Check, X } from 'lucide-react';
import { useFetch } from '../api';
import { Badge, Thumb } from '../components/ui';
import { useOrderActions } from './Orders';
import { money, dateTime } from '../utils/format';

export default function OrderDetails() {
  const { id } = useParams(), nav = useNavigate();
  const { data: o, loading, error, reload } = useFetch(`/orders/${id}`);
  const { buttons } = useOrderActions(reload);
  if (loading) return <div className="card"><div className="skel" style={{ height: 260 }} /></div>;
  if (error) return <div className="card"><p>{error}</p><Link className="btn" to="/orders">Back to orders</Link></div>;
  const steps = ['Pending', 'Processing', 'Completed'], idx = steps.indexOf(o.status);
  return (
    <>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={() => nav('/orders')}><ArrowLeft size={16} /> Orders</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>{buttons(o)}<button className="btn" onClick={() => window.print()}><Printer size={16} /> {o.status === 'Completed' ? 'Print invoice' : 'Print'}</button></div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 className="mono" style={{ fontSize: 28 }}>{o.orderNumber}</h1><Badge status={o.status} /><span className="muted" style={{ marginLeft: 'auto' }}>{dateTime(o.createdAt)}</span></div>
        <p className="invoice-only">INVOICE - StockYard Inventory & Warehouse</p>
        <div className="stepper no-print" style={{ margin: '26px 0 10px' }}>
          {o.status === 'Cancelled' ? <div className="step cancel" style={{ flex: 'none', margin: '0 auto' }}><i><X size={16} /></i>Cancelled</div>
            : steps.map((s, i) => <div key={s} className={`step ${i < idx ? 'done' : i === idx ? 'now' : ''}`}><i>{i <= idx ? <Check size={16} /> : i + 1}</i>{s}</div>)}
        </div>
        <div className="grid g3" style={{ margin: '20px 0' }}>
          <div><small className="muted">Customer</small><b style={{ display: 'block' }}>{o.customerName}</b><span className="muted">{o.customerPhone || '-'}</span></div>
          <div><small className="muted">Ships from</small><b style={{ display: 'block' }}>{o.warehouse?.name}</b><span className="muted">{o.warehouse?.location}</span></div>
          <div><small className="muted">Created by</small><b style={{ display: 'block' }}>{o.createdBy?.name}</b><span className="muted">{o.createdBy?.email}</span></div></div>
        <div className="tablewrap"><table><thead><tr><th>Product</th><th className="right">Qty</th><th className="right">Unit price</th><th className="right">Line total</th></tr></thead>
          <tbody>{o.products.map(l => <tr key={l._id}><td><div className="cell"><Thumb src={l.product?.imageUrl} name={l.product?.name} /><div><b>{l.product?.name}</b><small className="mono">{l.product?.sku}</small></div></div></td><td className="right">{l.quantity}</td><td className="right">{money(l.price)}</td><td className="right"><b>{money(l.quantity * l.price)}</b></td></tr>)}
            <tr><td colSpan={3} className="right muted">Grand total</td><td className="right"><b style={{ fontSize: 22, fontFamily: 'var(--display)' }}>{money(o.totalAmount)}</b></td></tr></tbody></table></div>
      </div>
    </>
  );
}
