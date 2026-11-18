import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Plus, Download, Play, CheckCheck, XCircle } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { Badge, PageHead, Table } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { confirmBox, successBox, errorBox } from '../utils/alert';
import { money, dateTime, exportCSV } from '../utils/format';

export const useOrderActions = (reload) => {
  const { user } = useAuth();
  const staff = ['admin', 'warehouseManager'].includes(user.role);
  const setStatus = async (o, status) => {
    const meta = { Processing: ['Process this order?', 'Stock will be deducted from the warehouse right now.'], Completed: ['Mark as completed?', 'The order will be closed.'], Cancelled: ['Cancel this order?', 'This cannot be undone.'] }[status];
    if (!(await confirmBox({ title: meta[0], text: meta[1], confirmText: `Yes, ${status === 'Processing' ? 'process' : status === 'Completed' ? 'complete' : 'cancel'}`, danger: status === 'Cancelled', icon: status === 'Cancelled' ? 'warning' : 'question' }))) return;
    try { await api.put(`/orders/${o._id}/status`, { status }); successBox(`Order ${status.toLowerCase()}`); reload(); } catch (e) { errorBox('Could not update order', errMsg(e)); }
  };
  const cancel = async o => {
    if (!(await confirmBox({ title: 'Cancel your order?', text: 'Only unprocessed orders can be cancelled.', confirmText: 'Cancel order' }))) return;
    try { await api.put(`/orders/${o._id}/cancel`); successBox('Order cancelled'); reload(); } catch (e) { errorBox('Could not cancel', errMsg(e)); }
  };
  const buttons = o => (
    <div className="actions-cell" onClick={e => e.stopPropagation()}>
      {staff && o.status === 'Pending' && <button className="btn sm primary" onClick={() => setStatus(o, 'Processing')}><Play size={13} /> Process</button>}
      {staff && o.status === 'Processing' && <button className="btn sm primary" onClick={() => setStatus(o, 'Completed')}><CheckCheck size={13} /> Complete</button>}
      {staff && o.status === 'Pending' && <button className="btn sm danger" onClick={() => setStatus(o, 'Cancelled')}><XCircle size={13} /></button>}
      {!staff && o.status === 'Pending' && <button className="btn sm danger" onClick={() => cancel(o)}><XCircle size={13} /> Cancel</button>}
    </div>);
  return { buttons, staff };
};

const TABS = ['', 'Pending', 'Processing', 'Completed', 'Cancelled'];
export default function Orders() {
  const { user } = useAuth(), nav = useNavigate();
  const [status, setStatus] = useState(''), [search, setSearch] = useState('');
  const { data, loading, reload } = useFetch('/orders', { status, search }), { data: allOrders } = useFetch('/orders');
  const { buttons } = useOrderActions(() => { reload(); });
  const count = t => t ? (allOrders || []).filter(o => o.status === t).length : (allOrders || []).length;
  return (
    <>
      <PageHead title={user.role === 'salesRepresentative' ? 'My orders' : 'Orders'} subtitle="Track every order from Pending to Completed.">
        <button className="btn" onClick={() => exportCSV('orders.csv', (data || []).map(o => ({ order: o.orderNumber, customer: o.customerName, total: o.totalAmount, status: o.status, date: o.createdAt })))}><Download size={16} /> Export</button>
        {['admin', 'salesRepresentative'].includes(user.role) && <Link to="/orders/new" className="btn primary"><Plus size={17} /> New order</Link>}
      </PageHead>
      <div className="toolbar">
        <div className="seg" style={{ flexWrap: 'wrap' }}>{TABS.map(t => <button key={t} className={status === t ? 'on' : ''} onClick={() => setStatus(t)}>{t || 'All'} <span className="muted">{count(t)}</span></button>)}</div>
        <div className="inputicon grow"><Search size={18} /><input className="input" placeholder="Search order number or customer" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <Table loading={loading} rows={data} onRow={o => nav(`/orders/${o._id}`)} columns={[
        { label: 'Order', render: o => <b className="mono">{o.orderNumber}</b> }, { label: 'Customer', render: o => <div><b>{o.customerName}</b><small className="muted" style={{ display: 'block' }}>{o.customerPhone}</small></div> },
        { label: 'Items', render: o => o.products.reduce((s, p) => s + p.quantity, 0) }, { label: 'Warehouse', render: o => o.warehouse?.name },
        { label: 'Total', render: o => <b>{money(o.totalAmount)}</b> }, { label: 'Placed', render: o => dateTime(o.createdAt) },
        { label: 'Status', render: o => <Badge status={o.status} /> }, { label: '', right: true, render: buttons }
      ]} />
    </>
  );
}
