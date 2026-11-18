import { useState } from 'react';
import { Search, Download, Phone, CheckCircle2, XCircle, AlertTriangle, TrendingDown } from 'lucide-react';
import { useFetch } from '../api';
import { Badge, PageHead, Table, Thumb, LevelBar, Empty, StatCard } from '../components/ui';
import { dateTime, exportCSV } from '../utils/format';

export function Transactions() {
  const [f, setF] = useState({ type: '', warehouse: '', from: '', to: '' }), [s, setS] = useState('');
  const { data, loading } = useFetch('/transactions', f), { data: whs } = useFetch('/warehouses');
  const rows = (data || []).filter(t => !s || t.product?.name.toLowerCase().includes(s.toLowerCase()) || t.note?.toLowerCase().includes(s.toLowerCase()));
  const inN = rows.filter(r => r.transactionType === 'stock-in').reduce((a, r) => a + r.quantity, 0), outN = rows.filter(r => r.transactionType === 'stock-out').reduce((a, r) => a + r.quantity, 0);
  return (
    <>
      <PageHead title="Stock transactions" subtitle={`In the current view: +${inN} received, -${outN} removed.`}>
        <button className="btn" onClick={() => exportCSV('transactions.csv', rows.map(t => ({ date: t.date, type: t.transactionType, product: t.product?.name, warehouse: t.warehouse?.name, quantity: t.quantity, by: t.performedBy?.name, note: t.note })))}><Download size={16} /> Export CSV</button>
      </PageHead>
      <div className="toolbar">
        <div className="inputicon grow"><Search size={18} /><input className="input" placeholder="Search product or note" value={s} onChange={e => setS(e.target.value)} /></div>
        <select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">In & out</option><option value="stock-in">Stock in</option><option value="stock-out">Stock out</option></select>
        <select className="input" value={f.warehouse} onChange={e => setF({ ...f, warehouse: e.target.value })}><option value="">All warehouses</option>{(whs || []).map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select>
        <input className="input" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} aria-label="From date" />
        <input className="input" type="date" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} aria-label="To date" />
      </div>
      <Table loading={loading} rows={rows} columns={[
        { label: 'When', render: t => dateTime(t.date) },
        { label: 'Type', render: t => <Badge status={t.transactionType} label={t.transactionType === 'stock-in' ? 'Stock in' : 'Stock out'} /> },
        { label: 'Product', render: t => <div className="cell"><Thumb src={t.product?.imageUrl} name={t.product?.name} /><div><b>{t.product?.name}</b><small className="mono">{t.product?.sku}</small></div></div> },
        { label: 'Warehouse', render: t => t.warehouse?.name },
        { label: 'Qty', render: t => <b className="mono" style={{ color: t.transactionType === 'stock-in' ? 'var(--success)' : 'var(--danger)' }}>{t.transactionType === 'stock-in' ? '+' : '-'}{t.quantity}</b> },
        { label: 'By', render: t => t.performedBy?.name || '-' }, { label: 'Note', render: t => <span className="muted">{t.note || '-'}</span> }
      ]} />
    </>
  );
}

export function LowStock() {
  const { data, loading } = useFetch('/stock/low');
  return (
    <>
      <PageHead title="Low-stock alerts" subtitle="Quantity at or below the product's limit. Contact the supplier to restock." />
      {!loading && !!data?.length && <div className="grid g3" style={{ marginBottom: 16 }}>
        <StatCard icon={XCircle} tone="red" label="Out of stock" value={data.filter(r => r.quantity === 0).length} />
        <StatCard icon={AlertTriangle} label="Critical (under half the limit)" value={data.filter(r => r.quantity > 0 && r.quantity <= r.product.lowStockLimit / 2).length} />
        <StatCard icon={TrendingDown} tone="blue" label="Running low" value={data.filter(r => r.quantity > r.product.lowStockLimit / 2).length} />
      </div>}
      <Table loading={loading} rows={data} empty={<Empty icon={CheckCircle2} title="Everything is above its limit" text="No restocking needed right now." />} columns={[
        { label: 'Product', render: r => <div className="cell"><Thumb src={r.product.imageUrl} name={r.product.name} /><div><b>{r.product.name}</b><small className="mono">{r.product.sku}</small></div></div> },
        { label: 'Warehouse', render: r => r.warehouse.name },
        { label: 'Left / limit', render: r => <div style={{ minWidth: 140 }}><b className="mono" style={{ color: 'var(--danger)' }}>{r.quantity}</b> <span className="muted">/ {r.product.lowStockLimit}</span><LevelBar qty={r.quantity} limit={r.product.lowStockLimit} /></div> },
        { label: 'Urgency', render: r => r.quantity === 0 ? <Badge status="Out" label="Out of stock" pulse /> : r.quantity <= r.product.lowStockLimit / 2 ? <Badge status="Out" label="Critical" pulse /> : <Badge status="Low" label="Running low" /> },
        { label: 'Supplier', render: r => r.product.supplier ? <div><b>{r.product.supplier.companyName || r.product.supplier.name}</b><small className="muted" style={{ display: 'block' }}><Phone size={12} /> {r.product.supplier.phone || r.product.supplier.email}</small></div> : '-' }
      ]} />
    </>
  );
}
