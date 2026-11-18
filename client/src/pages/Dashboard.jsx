import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Users, Package, Warehouse, Truck, ShoppingCart, AlertTriangle, Boxes, Banknote, CheckCircle2, Clock, Plus, ArrowDownToLine, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFetch } from '../api';
import { StatCard, Badge, Empty, LevelBar } from '../components/ui';
import { greeting, money, dateTime, ROLE_LABEL } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
// vertical gradient fill for bars / areas (falls back to the flat colour until the chart has a size)
const grad = color => ctx => {
  const { chart } = ctx, a = chart.chartArea; if (!a) return color;
  const g = chart.ctx.createLinearGradient(0, a.bottom, 0, a.top); g.addColorStop(0, color + '40'); g.addColorStop(1, color); return g;
};
const STATUS_COL = { Pending: '#d98a00', Processing: '#2f7de1', Completed: '#12a150', Cancelled: '#e5484d', Approved: '#12a150', Rejected: '#e5484d' };

function useChartOpts() {
  const { resolved } = useTheme(); // re-read colours when theme flips
  const text = css('--muted'), grid = css('--border'), accent = css('--accent'), surface = css('--surface');
  return { text, grid, accent, surface, key: resolved + accent, opts: (extra = {}) => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: text, usePointStyle: true } } }, scales: { x: { ticks: { color: text }, grid: { display: false } }, y: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true } }, ...extra }) };
}
const Box = ({ title, icon: I, children, h = 260 }) => <div className="card"><h3>{I && <I size={18} />}{title}</h3><div style={{ height: h }}>{children}</div></div>;
const Doughnutish = ({ counts, c }) => {
  const labels = Object.keys(counts || {});
  return labels.length ? <Doughnut key={c.key} data={{ labels, datasets: [{ data: labels.map(l => counts[l]), backgroundColor: labels.map(l => STATUS_COL[l]), borderWidth: 3, borderColor: c.surface, hoverOffset: 6, borderRadius: 6 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: c.text, usePointStyle: true } } } }} /> : <Empty title="No data yet" />;
};
const LowPreview = ({ rows }) => (
  <div className="card"><h3><AlertTriangle size={18} /> Needs restocking <Link to="/low-stock" className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>See all</Link></h3>
    {!rows?.length ? <Empty title="All stocked up" text="Nothing is below its limit." icon={CheckCircle2} /> : rows.map(r => (
      <div key={r._id} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{r.product.name}</b><span className="mono">{r.quantity}/{r.product.lowStockLimit}</span></div>
        <small className="muted">{r.warehouse.name}</small><LevelBar qty={r.quantity} limit={r.product.lowStockLimit} /></div>))}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth(), { data: d, loading } = useFetch('/dashboard'), c = useChartOpts();
  const qa = { admin: [['/products', 'Add product', Plus], ['/users', 'Add user', Users]], warehouseManager: [['/inventory', 'Receive stock', ArrowDownToLine]], supplier: [['/supply-requests', 'New supply request', Plus]], salesRepresentative: [['/orders/new', 'New order', Plus], ['/products', 'Find products', Search]] }[user.role];
  return (
    <>
      <div className="hello">
        <div><h1>{greeting()}, {user.name.split(' ')[0]}</h1><p>{ROLE_LABEL[user.role]} - {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
        <div className="qa">{qa.map(([to, l, I]) => <Link key={to} to={to} className="btn primary"><I size={17} /> {l}</Link>)}</div>
      </div>
      {loading || !d ? <div className="grid g4">{[1, 2, 3, 4].map(i => <div key={i} className="card"><div className="skel" style={{ height: 48 }} /></div>)}</div> : (
        <div className="grid">
          {d.role === 'admin' && <>
            <div className="grid g4">
              <StatCard icon={Users} label="Users" value={d.stats.users} to="/users" /><StatCard icon={Package} label="Products" value={d.stats.products} to="/products" tone="blue" />
              <StatCard icon={Warehouse} label="Warehouses" value={d.stats.warehouses} to="/warehouses" tone="green" /><StatCard icon={Truck} label="Suppliers" value={d.stats.suppliers} to="/users" />
              <StatCard icon={ShoppingCart} label="Orders" value={d.stats.orders} to="/orders" tone="blue" /><StatCard icon={AlertTriangle} label="Low-stock items" value={d.stats.lowStock} to="/low-stock" tone="red" />
              <StatCard icon={Clock} label="Supply requests pending" value={d.stats.pendingSupply} to="/supply-requests" /></div>
            <div className="grid g-main">
              <Box title="Revenue, last 6 months" icon={Banknote}><Bar key={c.key} data={{ labels: d.salesByMonth.map(m => m._id), datasets: [{ label: 'Revenue (Rs.)', data: d.salesByMonth.map(m => m.revenue), backgroundColor: grad(c.accent), borderRadius: 10, borderSkipped: false, maxBarThickness: 46 }] }} options={c.opts()} /></Box>
              <Box title="Orders by status"><Doughnutish counts={d.ordersByStatus} c={c} /></Box></div>
            <div className="grid g3">
              <Box title="Top selling products" icon={Package}><Bar key={c.key} data={{ labels: d.topProducts.map(p => p.name), datasets: [{ label: 'Units', data: d.topProducts.map(p => p.units), backgroundColor: grad('#2f7de1'), borderRadius: 8, borderSkipped: false }] }} options={c.opts({ indexAxis: 'y', plugins: { legend: { display: false } } })} /></Box>
              <Box title="Stock by warehouse" icon={Boxes}><Bar key={c.key} data={{ labels: d.stockByWarehouse.map(p => p.name), datasets: [{ label: 'Units', data: d.stockByWarehouse.map(p => p.units), backgroundColor: grad('#12a150'), borderRadius: 10, borderSkipped: false, maxBarThickness: 46 }] }} options={c.opts({ plugins: { legend: { display: false } } })} /></Box>
              <LowPreview rows={d.lowPreview} /></div>
            <div className="card"><h3><ShoppingCart size={18} /> Recent orders</h3>
              {d.recentOrders.map(o => <Link key={o._id} to={`/orders/${o._id}`} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)', alignItems: 'center' }}><b className="mono">{o.orderNumber}</b><span className="muted">{o.customerName}</span><span style={{ marginLeft: 'auto' }}>{money(o.totalAmount)}</span><Badge status={o.status} /></Link>)}</div>
          </>}

          {d.role === 'warehouseManager' && <>
            <div className="grid g4"><StatCard icon={Warehouse} label="My warehouses" value={d.stats.warehouses} to="/warehouses" /><StatCard icon={Boxes} label="Units in stock" value={d.stats.totalUnits} to="/inventory" tone="green" />
              <StatCard icon={AlertTriangle} label="Low-stock items" value={d.stats.lowStock} to="/low-stock" tone="red" /><StatCard icon={ShoppingCart} label="Orders to process" value={d.stats.pendingOrders} to="/orders" tone="blue" /></div>
            <div className="grid g-main">
              <Box title="Stock movement, last 7 days" icon={Boxes}>{(() => {
                const days = [...Array(7)].map((_, i) => { const x = new Date(); x.setDate(x.getDate() - 6 + i); return x.toISOString().slice(0, 10); });
                const val = t => days.map(day => d.movement.filter(m => m._id.d === day && m._id.t === t).reduce((s, m) => s + m.qty, 0));
                return <Line key={c.key} data={{ labels: days.map(x => x.slice(5)), datasets: [{ label: 'Stock in', data: val('stock-in'), borderColor: '#12a150', backgroundColor: '#12a15022', fill: true, tension: .35 }, { label: 'Stock out', data: val('stock-out'), borderColor: '#e5484d', backgroundColor: '#e5484d22', fill: true, tension: .35 }] }} options={c.opts()} />; })()}</Box>
              <LowPreview rows={d.lowPreview} /></div>
            <div className="grid g2">
              <div className="card"><h3><Warehouse size={18} /> Warehouse utilisation</h3>{d.warehouses.map(w => <div key={w._id} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{w.name}</b><span className="mono">{w.used}/{w.capacity || '∞'}</span></div><div className="bar acc"><i style={{ width: `${w.capacity ? Math.min(100, w.used / w.capacity * 100) : 8}%` }} /></div></div>)}{!d.warehouses.length && <Empty title="No warehouse assigned" text="Ask an admin to assign you one." />}</div>
              <div className="card"><h3>Latest movements</h3>{d.recent.map(t => <div key={t._id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: '1px solid var(--border)', alignItems: 'center' }}><Badge status={t.transactionType} /><span>{t.product?.name}</span><span className="mono" style={{ marginLeft: 'auto' }}>{t.quantity}</span><small className="muted">{dateTime(t.date)}</small></div>)}</div></div>
          </>}

          {d.role === 'supplier' && <>
            <div className="grid g4"><StatCard icon={Package} label="My products" value={d.stats.products} to="/products" /><StatCard icon={Truck} label="Requests sent" value={d.stats.total} to="/supply-requests" tone="blue" />
              <StatCard icon={Clock} label="Waiting for review" value={d.stats.pending} to="/supply-requests" /><StatCard icon={CheckCircle2} label="Approved" value={d.stats.approved} to="/supply-requests" tone="green" /></div>
            <div className="grid g-main"><Box title="Request status"><Doughnutish counts={d.requestsByStatus} c={c} /></Box>
              <div className="card"><h3>Recent requests</h3>{!d.recent.length && <Empty title="No requests yet" />}{d.recent.map(r => <div key={r._id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: '1px solid var(--border)', alignItems: 'center' }}><span>{r.product?.name}</span><span className="muted">to {r.warehouse?.name}</span><span className="mono" style={{ marginLeft: 'auto' }}>x{r.quantity}</span><Badge status={r.status} /></div>)}</div></div>
          </>}

          {d.role === 'salesRepresentative' && <>
            <div className="grid g4"><StatCard icon={ShoppingCart} label="My orders" value={d.stats.orders} to="/orders" /><StatCard icon={Clock} label="Pending" value={d.stats.pending} to="/orders" tone="blue" />
              <StatCard icon={CheckCircle2} label="Completed" value={d.stats.completed} to="/orders" tone="green" /><StatCard icon={Banknote} label="Sales value" prefix="Rs. " value={d.stats.revenue} /></div>
            <div className="grid g-main"><Box title="My orders by status"><Doughnutish counts={d.ordersByStatus} c={c} /></Box>
              <div className="card"><h3>Recent orders</h3>{!d.recent.length && <Empty title="No orders yet" text="Create your first sales order." />}{d.recent.map(o => <Link key={o._id} to={`/orders/${o._id}`} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: '1px solid var(--border)', alignItems: 'center' }}><b className="mono">{o.orderNumber}</b><span style={{ marginLeft: 'auto' }}>{money(o.totalAmount)}</span><Badge status={o.status} /></Link>)}</div></div>
          </>}
        </div>)}
    </>
  );
}
