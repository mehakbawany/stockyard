const router = require('express').Router();
const Stock = require('../models/Stock');
const Warehouse = require('../models/Warehouse');
const { protect, authorize, warehouseScope, assertWarehouseAccess } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');
const { stockIn, stockOut, getLowStock, syncLowStockNotifications } = require('../services/stock');
const MGR = authorize('admin', 'warehouseManager');

router.post('/in', protect, MGR, ah(async (req, res) => {
  const { product, warehouse, quantity, note } = req.body;
  if (!product || !warehouse) throw httpError(400, 'Product and warehouse are required');
  await assertWarehouseAccess(req.user, warehouse);
  const r = await stockIn({ product, warehouse, quantity, note, user: req.user });
  res.status(201).json(r);
}));

router.post('/out', protect, MGR, ah(async (req, res) => {
  const { product, warehouse, quantity, note } = req.body;
  if (!product || !warehouse) throw httpError(400, 'Product and warehouse are required');
  await assertWarehouseAccess(req.user, warehouse);
  const r = await stockOut({ product, warehouse, quantity, note, user: req.user });
  res.status(201).json(r);
}));

// bonus: transfer between warehouses (creates an outgoing and an incoming transaction)
router.post('/transfer', protect, MGR, ah(async (req, res) => {
  const { product, fromWarehouse, toWarehouse, quantity, note } = req.body;
  if (!product || !fromWarehouse || !toWarehouse) throw httpError(400, 'Product, source and destination are required');
  if (String(fromWarehouse) === String(toWarehouse)) throw httpError(400, 'Source and destination must differ');
  await assertWarehouseAccess(req.user, fromWarehouse);
  const [from, to] = await Promise.all([Warehouse.findById(fromWarehouse), Warehouse.findById(toWarehouse)]);
  if (!from || !to) throw httpError(404, 'Warehouse not found');
  await stockOut({ product, warehouse: fromWarehouse, quantity, note: `Transfer to ${to.name}${note ? ' - ' + note : ''}`, user: req.user });
  try {
    await stockIn({ product, warehouse: toWarehouse, quantity, note: `Transfer from ${from.name}${note ? ' - ' + note : ''}`, user: req.user });
  } catch (e) {
    await stockIn({ product, warehouse: fromWarehouse, quantity, note: 'Transfer rolled back', user: req.user });
    throw e;
  }
  res.status(201).json({ message: 'Transfer complete' });
}));

router.get('/low', protect, MGR, ah(async (req, res) => {
  const scope = await warehouseScope(req.user);
  syncLowStockNotifications(req.user._id, scope).catch(() => {});
  res.json(await getLowStock(scope));
}));

// live count for the sidebar badge: always matches what the Low stock page lists
router.get('/low/count', protect, MGR, ah(async (req, res) => {
  res.json({ count: (await getLowStock(await warehouseScope(req.user))).length });
}));

router.get('/', protect, authorize('admin', 'warehouseManager', 'salesRepresentative'), ah(async (req, res) => {
  const { warehouse, product, search, level } = req.query; const q = {};
  const ids = await warehouseScope(req.user);
  if (ids) q.warehouse = { $in: ids };
  if (warehouse) {
    if (ids && !ids.includes(warehouse)) throw httpError(403, 'You are not assigned to this warehouse');
    q.warehouse = warehouse;
  }
  if (product) q.product = product;
  let rows = await Stock.find(q).populate('product', 'name sku category price lowStockLimit imageUrl supplier').populate('warehouse', 'name location capacity').sort('-updatedAt').lean();
  rows = rows.filter(r => r.product && r.warehouse);
  if (search) { const s = search.toLowerCase(); rows = rows.filter(r => r.product.name.toLowerCase().includes(s) || r.product.sku.toLowerCase().includes(s)); }
  rows = rows.map(r => ({ ...r, low: r.quantity <= r.product.lowStockLimit }));
  if (level === 'low') rows = rows.filter(r => r.low && r.quantity > 0);
  if (level === 'out') rows = rows.filter(r => r.quantity === 0);
  if (level === 'ok') rows = rows.filter(r => !r.low);
  res.json(rows);
}));
module.exports = router;
