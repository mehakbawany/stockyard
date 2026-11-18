import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, LayoutGrid, List, Download } from 'lucide-react';
import api, { useFetch, errMsg } from '../api';
import { Modal, Badge, PageHead, Table, Thumb, Empty, LevelBar } from '../components/ui';
import ImageUpload from '../components/ImageUpload';
import { useAuth } from '../context/AuthContext';
import { confirmBox, successBox } from '../utils/alert';
import { money, exportCSV } from '../utils/format';

const EMPTY = { name: '', sku: '', category: '', price: '', lowStockLimit: 10, supplier: '', description: '', imageUrl: '', imageFileId: '' };
const level = p => p.totalStock === 0 ? ['Out', 'Out of stock'] : p.totalStock <= p.lowStockLimit ? ['Low', 'Low stock'] : ['OK', 'In stock'];

export default function Products() {
  const { user } = useAuth(), nav = useNavigate();
  const canEdit = ['admin', 'warehouseManager'].includes(user.role), isAdmin = user.role === 'admin';
  const [f, setF] = useState({ search: '', category: '', supplier: '', availability: '' }), [view, setView] = useState('grid');
  const { data, loading, reload } = useFetch('/products', f);
  const { data: all } = useFetch('/products'), { data: suppliers } = useFetch('/users/suppliers');
  const cats = [...new Set((all || []).map(p => p.category))];
  const [form, setForm] = useState(null), [busy, setBusy] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const save = async e => {
    e.preventDefault();
    if (!form.imageFileId) return toast.error('Please upload a product image');
    setBusy(true);
    try {
      form._id ? await api.put(`/products/${form._id}`, form) : await api.post('/products', form);
      setForm(null); reload(); successBox(form._id ? 'Product updated' : 'Product added');
    } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const remove = async p => {
    if (!(await confirmBox({ title: `Delete ${p.name}?`, text: 'This also removes its stock records and image.', confirmText: 'Delete product' }))) return;
    try { await api.delete(`/products/${p._id}`); toast.success('Product deleted'); reload(); } catch (er) { toast.error(errMsg(er)); }
  };
  const edit = p => setForm({ ...EMPTY, ...p, supplier: p.supplier?._id || '' });
  const open = p => (user.role === 'salesRepresentative' || user.role === 'supplier') && nav(`/products/${p._id}`);

  const Actions = ({ p }) => canEdit ? <div className="actions-cell" onClick={e => e.stopPropagation()}><button className="btn sm" onClick={() => edit(p)}><Pencil size={14} /></button>{isAdmin && <button className="btn sm danger" onClick={() => remove(p)}><Trash2 size={14} /></button>}</div> : null;

  return (
    <>
      <PageHead title={user.role === 'supplier' ? 'My products' : user.role === 'salesRepresentative' ? 'Find products' : 'Products'} subtitle="Search the catalogue and see live availability.">
        <button className="btn" onClick={() => exportCSV('products.csv', (data || []).map(p => ({ sku: p.sku, name: p.name, category: p.category, price: p.price, stock: p.totalStock })))}><Download size={16} /> Export</button>
        {canEdit && <button className="btn primary" onClick={() => setForm({ ...EMPTY })}><Plus size={17} /> Add product</button>}
      </PageHead>
      <div className="toolbar">
        <div className="inputicon grow"><Search size={18} /><input className="input" placeholder="Search by name, SKU or category" value={f.search} onChange={e => setF({ ...f, search: e.target.value })} /></div>
        <select className="input" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option value="">All categories</option>{cats.map(c => <option key={c}>{c}</option>)}</select>
        {user.role !== 'supplier' && <select className="input" value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })}><option value="">All suppliers</option>{(suppliers || []).map(s => <option key={s._id} value={s._id}>{s.companyName || s.name}</option>)}</select>}
        <select className="input" value={f.availability} onChange={e => setF({ ...f, availability: e.target.value })}><option value="">Any availability</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        <div className="seg"><button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={16} /></button><button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List view"><List size={16} /></button></div>
      </div>

      {view === 'grid' ? (
        loading ? <div className="pgrid">{[1, 2, 3, 4].map(i => <div key={i} className="card" style={{ height: 280 }}><div className="skel" style={{ height: '100%' }} /></div>)}</div>
        : !data?.length ? <div className="card"><Empty title="No products match" text="Try clearing a filter." /></div>
        : <div className="pgrid">{data.map(p => { const [k, l] = level(p); return (
          <div key={p._id} className="card pcard" style={{ cursor: 'pointer' }} onClick={() => open(p)}>
            <div className="pimg">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : p.name[0]}<Badge status={k} label={l} pulse={k !== 'OK'} /></div>
            <div className="pbody"><div className="mono muted">{p.sku} - {p.category}</div><b style={{ fontSize: 16 }}>{p.name}</b>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span className="price">{money(p.price)}</span><span className="mono">{p.totalStock} units</span></div>
              <LevelBar qty={p.totalStock} limit={p.lowStockLimit} />
              {p.supplier && <small className="muted">by {p.supplier.companyName || p.supplier.name}</small>}
              <Actions p={p} /></div>
          </div>); })}</div>
      ) : (
        <Table loading={loading} rows={data} onRow={open} columns={[
          { label: 'Product', render: p => <div className="cell"><Thumb src={p.imageUrl} name={p.name} /><div><b>{p.name}</b><small className="mono">{p.sku}</small></div></div> },
          { label: 'Category', render: p => p.category }, { label: 'Supplier', render: p => p.supplier?.companyName || p.supplier?.name || '-' },
          { label: 'Price', render: p => money(p.price) }, { label: 'Stock', render: p => <div style={{ minWidth: 110 }}><span className="mono">{p.totalStock}</span><LevelBar qty={p.totalStock} limit={p.lowStockLimit} /></div> },
          { label: 'Status', render: p => { const [k, l] = level(p); return <Badge status={k} label={l} />; } },
          { label: '', right: true, render: p => <Actions p={p} /> }
        ]} />
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?._id ? 'Edit product' : 'Add product'} wide>
        {form && <form onSubmit={save}>
          <ImageUpload label="Product image" value={form.imageUrl} removable={false} onChange={v => setForm({ ...form, imageUrl: v.url, imageFileId: v.fileId })} />
          <div className="row" style={{ marginTop: 16 }}>
            <div className="field"><label>Name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
            <div className="field"><label>SKU</label><input className="input mono" required value={form.sku} onChange={set('sku')} placeholder="KB-001" /></div></div>
          <div className="row3 row">
            <div className="field"><label>Category</label><input className="input" required list="cats" value={form.category} onChange={set('category')} /><datalist id="cats">{cats.map(c => <option key={c} value={c} />)}</datalist></div>
            <div className="field"><label>Price (Rs.)</label><input className="input" type="number" min="0" required value={form.price} onChange={set('price')} /></div>
            <div className="field"><label>Low-stock limit</label><input className="input" type="number" min="0" required value={form.lowStockLimit} onChange={set('lowStockLimit')} /></div></div>
          <div className="field"><label>Supplier</label><select className="input" required value={form.supplier} onChange={set('supplier')}><option value="">Select supplier</option>{(suppliers || []).map(s => <option key={s._id} value={s._id}>{s.companyName || s.name}</option>)}</select></div>
          <div className="field"><label>Description</label><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></div>
          <div className="modal-foot"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving...' : 'Save product'}</button></div>
        </form>}
      </Modal>
    </>
  );
}
