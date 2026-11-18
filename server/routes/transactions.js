const router = require('express').Router();
const StockTransaction = require('../models/StockTransaction');
const { protect, authorize, warehouseScope } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');

router.get('/', protect, authorize('admin', 'warehouseManager'), ah(async (req, res) => {
  const { type, warehouse, product, from, to, limit } = req.query; const q = {};
  const ids = await warehouseScope(req.user);
  if (ids) q.warehouse = { $in: ids };
  if (warehouse) { if (ids && !ids.includes(warehouse)) throw httpError(403, 'You are not assigned to this warehouse'); q.warehouse = warehouse; }
  if (type) q.transactionType = type;
  if (product) q.product = product;
  if (from || to) q.date = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to + 'T23:59:59') }) };
  res.json(await StockTransaction.find(q).populate('product', 'name sku imageUrl').populate('warehouse', 'name').populate('performedBy', 'name role').sort('-date').limit(Math.min(Number(limit) || 300, 1000)));
}));
module.exports = router;
