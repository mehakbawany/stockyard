const Stock = require('../models/Stock');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { httpError, positiveInt } = require('../utils/helpers');
const Notification = require('../models/Notification');
const { notify, notifyAdmins } = require('../utils/notify');

const lowKey = (product, warehouse) => `low:${product}:${warehouse}`;

async function checkLowStock(productId, warehouseId) {
  const s = await Stock.findOne({ product: productId, warehouse: warehouseId })
    .populate('product', 'name lowStockLimit').populate('warehouse', 'name manager');
  if (!s || !s.product || s.quantity > s.product.lowStockLimit) return;
  const out = s.quantity === 0;
  const payload = {
    title: out ? 'Out of stock' : 'Low stock alert',
    message: `${s.product.name} has ${s.quantity} unit(s) left in ${s.warehouse.name} (limit ${s.product.lowStockLimit}).`,
    type: out ? 'danger' : 'warning', link: '/low-stock', key: lowKey(productId, warehouseId)
  };
  await notifyAdmins(payload);
  if (s.warehouse.manager) await notify([s.warehouse.manager], payload);
}

// Restocked above the limit? Then the old low-stock alert for this product+warehouse is no longer true, so remove it.
async function resolveLowStock(productId, warehouseId) {
  const s = await Stock.findOne({ product: productId, warehouse: warehouseId }).populate('product', 'lowStockLimit');
  if (s && s.product && s.quantity <= s.product.lowStockLimit) return;
  await Notification.deleteMany({ key: lowKey(productId, warehouseId) });
}

// Keeps one user's low-stock alerts honest: drops any alert whose product is no longer low
// (and old un-keyed ones created before this fix). Runs whenever notifications / low stock are read.
async function syncLowStockNotifications(userId, warehouseIds) {
  const existing = await Notification.find({ user: userId, link: '/low-stock' }).select('key');
  if (!existing.length) return;
  const live = new Set((await getLowStock(warehouseIds)).map(r => lowKey(r.product._id, r.warehouse._id)));
  const stale = existing.filter(n => !n.key || !live.has(n.key)).map(n => n._id);
  if (stale.length) await Notification.deleteMany({ _id: { $in: stale } });
}

async function stockIn({ product, warehouse, quantity, note = '', user }) {
  const q = positiveInt(quantity);
  const [p, w] = await Promise.all([Product.findById(product), Warehouse.findById(warehouse)]);
  if (!p) throw httpError(404, 'Product not found');
  if (!w) throw httpError(404, 'Warehouse not found');
  if (w.capacity > 0) {
    const agg = await Stock.aggregate([{ $match: { warehouse: w._id } }, { $group: { _id: null, t: { $sum: '$quantity' } } }]);
    const used = agg[0]?.t || 0;
    if (used + q > w.capacity) throw httpError(400, `Capacity exceeded: ${w.name} holds ${used}/${w.capacity} units, only ${w.capacity - used} free`);
  }
  const stock = await Stock.findOneAndUpdate({ product, warehouse }, { $inc: { quantity: q } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const transaction = await StockTransaction.create({ product, warehouse, transactionType: 'stock-in', quantity: q, note, performedBy: user._id });
  resolveLowStock(product, warehouse).catch(() => {});
  return { stock, transaction };
}

async function stockOut({ product, warehouse, quantity, note = '', user }) {
  const q = positiveInt(quantity);
  // atomic: only deducts when enough stock exists, so quantity can never go negative
  const stock = await Stock.findOneAndUpdate({ product, warehouse, quantity: { $gte: q } }, { $inc: { quantity: -q } }, { new: true });
  if (!stock) {
    const cur = await Stock.findOne({ product, warehouse });
    throw httpError(400, `Insufficient stock: only ${cur ? cur.quantity : 0} unit(s) available`);
  }
  const transaction = await StockTransaction.create({ product, warehouse, transactionType: 'stock-out', quantity: q, note, performedBy: user._id });
  checkLowStock(product, warehouse).catch(() => {});
  return { stock, transaction };
}

async function getLowStock(warehouseIds) {
  const rows = await Stock.find(warehouseIds ? { warehouse: { $in: warehouseIds } } : {})
    .populate({ path: 'product', populate: { path: 'supplier', select: 'name phone email companyName' } })
    .populate('warehouse', 'name location');
  return rows.filter(r => r.product && r.quantity <= r.product.lowStockLimit).sort((a, b) => a.quantity - b.quantity);
}
module.exports = { stockIn, stockOut, getLowStock, checkLowStock, resolveLowStock, syncLowStockNotifications };
