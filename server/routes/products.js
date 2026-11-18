const router = require('express').Router();
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const { protect, authorize } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');
const { applyImage, removeFile } = require('../utils/image');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', protect, ah(async (req, res) => {
  const { search, category, supplier, availability } = req.query; const q = {};
  if (req.user.role === 'supplier') q.supplier = req.user._id; else if (supplier) q.supplier = supplier;
  if (category) q.category = category;
  if (search) { const r = new RegExp(esc(search), 'i'); q.$or = [{ name: r }, { sku: r }, { category: r }]; }
  const products = await Product.find(q).populate('supplier', 'name companyName image').sort('-createdAt').lean();
  const totals = await Stock.aggregate([{ $group: { _id: '$product', total: { $sum: '$quantity' } } }]);
  const map = Object.fromEntries(totals.map(t => [String(t._id), t.total]));
  let list = products.map(p => ({ ...p, totalStock: map[String(p._id)] || 0 }));
  if (availability === 'out') list = list.filter(p => p.totalStock === 0);
  if (availability === 'low') list = list.filter(p => p.totalStock > 0 && p.totalStock <= p.lowStockLimit);
  if (availability === 'in') list = list.filter(p => p.totalStock > p.lowStockLimit);
  res.json(list);
}));

router.get('/:id', protect, ah(async (req, res) => {
  const p = await Product.findById(req.params.id).populate('supplier', 'name companyName image email phone').populate('createdBy', 'name').lean();
  if (!p) throw httpError(404, 'Product not found');
  if (req.user.role === 'supplier' && String(p.supplier?._id) !== String(req.user._id)) throw httpError(403, 'Not your product');
  const stock = await Stock.find({ product: p._id }).populate('warehouse', 'name location');
  res.json({ ...p, stock, totalStock: stock.reduce((s, x) => s + x.quantity, 0) });
}));

router.post('/', protect, authorize('admin', 'warehouseManager'), ah(async (req, res) => {
  const b = req.body;
  if (!b.imageFileId) throw httpError(400, 'A product image must be uploaded through ImageKit');
  const p = new Product({ name: b.name, description: b.description, sku: b.sku, category: b.category, price: b.price, lowStockLimit: b.lowStockLimit, supplier: b.supplier || undefined, createdBy: req.user._id });
  await applyImage(p, b, 'imageUrl', 'imageFileId');
  await p.save();
  res.status(201).json(p);
}));

router.put('/:id', protect, authorize('admin', 'warehouseManager'), ah(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw httpError(404, 'Product not found');
  const b = req.body;
  ['name', 'description', 'sku', 'category', 'price', 'lowStockLimit'].forEach(f => { if (b[f] !== undefined) p[f] = b[f]; });
  if (b.supplier !== undefined) p.supplier = b.supplier || undefined;
  b.removeImage = false; // a product always keeps an image; replace instead
  await applyImage(p, b, 'imageUrl', 'imageFileId');
  await p.save();
  res.json(p);
}));

router.delete('/:id', protect, authorize('admin'), ah(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) throw httpError(404, 'Product not found');
  await Stock.deleteMany({ product: p._id });
  await removeFile(p.imageFileId);
  res.json({ message: 'Product deleted' });
}));
module.exports = router;
