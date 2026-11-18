import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, MapPin, Mail, Phone } from 'lucide-react';
import { useFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Badge, LevelBar } from '../components/ui';
import { money } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams(), nav = useNavigate(), { user } = useAuth();
  const { data: p, loading, error } = useFetch(`/products/${id}`);
  if (loading) return <div className="card"><div className="skel" style={{ height: 300 }} /></div>;
  if (error) return <div className="card"><p>{error}</p><Link to="/products" className="btn">Back</Link></div>;
  const state = p.totalStock === 0 ? ['Out', 'Out of stock'] : p.totalStock <= p.lowStockLimit ? ['Low', 'Low stock'] : ['OK', 'In stock'];
  return (
    <>
      <button className="btn ghost" onClick={() => nav(-1)} style={{ marginBottom: 14 }}><ArrowLeft size={16} /> Back</button>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(260px,420px) 1fr' }}>
        <div className="card pcard"><div className="pimg" style={{ aspectRatio: '1' }}>{p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : p.name[0]}</div></div>
        <div className="card">
          <div className="mono muted">{p.sku} - {p.category}</div>
          <h1 style={{ fontSize: 34, margin: '4px 0 10px' }}>{p.name}</h1>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><span className="price" style={{ fontSize: 30 }}>{money(p.price)}</span><Badge status={state[0]} label={`${state[1]} - ${p.totalStock} units`} pulse={state[0] !== 'OK'} /></div>
          <p className="muted" style={{ maxWidth: 560 }}>{p.description || 'No description added.'}</p>
          {p.supplier && <div className="cell" style={{ margin: '14px 0' }}><div><small className="muted">Supplied by</small><b>{p.supplier.companyName || p.supplier.name}</b>
            <small style={{ display: 'flex', gap: 12 }}>{p.supplier.email && <span><Mail size={12} /> {p.supplier.email}</span>}{p.supplier.phone && <span><Phone size={12} /> {p.supplier.phone}</span>}</small></div></div>}
          <h3 style={{ margin: '18px 0 10px' }}>Availability by warehouse</h3>
          {!p.stock.length && <p className="muted">Not stocked in any warehouse yet.</p>}
          {p.stock.map(s => <div key={s._id} style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span><MapPin size={14} /> {s.warehouse?.name}</span><b className="mono">{s.quantity}</b></div><LevelBar qty={s.quantity} limit={p.lowStockLimit} /></div>)}
          {user.role === 'salesRepresentative' && <button className="btn primary" style={{ marginTop: 14 }} disabled={!p.totalStock} onClick={() => nav('/orders/new', { state: { product: p._id } })}><ShoppingCart size={17} /> Add to a sales order</button>}
        </div>
      </div>
    </>
  );
}
