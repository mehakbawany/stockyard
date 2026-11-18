const router = require('express').Router();
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { protect, authorize, warehouseScope, assertWarehouseAccess } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');
const { notify, notifyAdmins } = require('../utils/notify');
const { stockIn, stockOut } = require('../services/stock');

const FLOW = { Pending: ['Processing', 'Cancelled'], Processing: ['Completed'] };
const populate = q => q.populate('createdBy', 'name email image').populate('warehouse', 'name location manager').populate('products.product', 'name sku imageUrl');
const genNumber = () => `ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

async function scope(user) {
  if (user.role === 'salesRepresentative') return { createdBy: user._id };
  if (user.role === 'warehouseManager') return { warehouse: { $in: await warehouseScope(user) } };
  return {};
}
async function loadVisible(req) {
  const order = await populate(Order.findOne({ _id: req.params.id, ...(await scope(req.user)) }));
  if (!order) throw httpError(404, 'Order not found (or you do not have access to it)');
  return order;
}

router.post('/', protect, authorize('salesRepresentative', 'admin'), ah(async (req, res) => {
  const { customerName, customerPhone, warehouse, products } = req.body;
  if (!customerName?.trim()) throw httpError(400, 'Customer name is required');
  if (!warehouse) throw httpError(400, 'Select a warehouse');
  if (!Array.isArray(products) || !products.length) throw httpError(400, 'Add at least one product');
  const merged = new Map();
  for (const l of products) {
    const q = Number(l.quantity);
    if (!Number.isInteger(q) || q <= 0) throw httpError(400, 'Quantities must be positive whole numbers');
    merged.set(String(l.product), (merged.get(String(l.product)) || 0) + q);
  }
  const ids = [...merged.keys()];
  const [prods, stocks, w] = await Promise.all([
    Product.find({ _id: { $in: ids } }), Stock.find({ warehouse, product: { $in: ids } }), Warehouse.findById(warehouse)
  ]);
  if (!w) throw httpError(404, 'Warehouse not found');
  if (prods.length !== ids.length) throw httpError(400, 'One or more products do not exist');
  let total = 0; const lines = [];
  for (const p of prods) {
    const need = merged.get(String(p._id));
    const have = stocks.find(s => String(s.product) === String(p._id))?.quantity || 0;
    if (need > have) throw httpError(400, `Insufficient stock for ${p.name}: requested ${need}, available ${have}`);
    lines.push({ product: p._id, quantity: need, price: p.price }); // price always taken from DB
    total += need * p.price;
  }
  const order = await Order.create({ orderNumber: genNumber(), customerName, customerPhone, products: lines, totalAmount: total, warehouse, createdBy: req.user._id });
  const payload = { title: 'New sales order', message: `${order.orderNumber} for ${customerName} - Rs. ${total.toLocaleString()}`, type: 'info', link: `/orders/${order._id}` };
  notifyAdmins(payload).catch(() => {}); notify([w.manager], payload).catch(() => {});
  res.status(201).json(await populate(Order.findById(order._id)));
}));

router.get('/', protect, authorize('admin', 'warehouseManager', 'salesRepresentative'), ah(async (req, res) => {
  const q = await scope(req.user); const { status, search } = req.query;
  if (status) q.status = status;
  if (search) { const r = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); q.$or = [{ orderNumber: r }, { customerName: r }]; }
  res.json(await populate(Order.find(q).sort('-createdAt')));
}));

router.get('/:id', protect, authorize('admin', 'warehouseManager', 'salesRepresentative'), ah(async (req, res) => res.json(await loadVisible(req))));

router.put('/:id/status', protect, authorize('admin', 'warehouseManager'), ah(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Order not found');
  await assertWarehouseAccess(req.user, order.warehouse);
  if (['Completed', 'Cancelled'].includes(order.status)) throw httpError(400, `A ${order.status.toLowerCase()} order cannot be changed`);
  if (!(FLOW[order.status] || []).includes(status)) throw httpError(400, `Cannot move an order from ${order.status} to ${status}`);

  if (status === 'Processing') {
    // atomic lock: only one request can ever move Pending -> Processing, so stock is deducted once
    const locked = await Order.findOneAndUpdate({ _id: order._id, status: 'Pending' }, { status: 'Processing' });
    if (!locked) throw httpError(409, 'This order has already been processed');
    const done = [];
    try {
      for (const l of order.products) {
        await stockOut({ product: l.product, warehouse: order.warehouse, quantity: l.quantity, note: `Sales order ${order.orderNumber}`, user: req.user });
        done.push(l);
      }
    } catch (e) {
      for (const l of done) await stockIn({ product: l.product, warehouse: order.warehouse, quantity: l.quantity, note: `Rollback ${order.orderNumber}`, user: req.user });
      await Order.updateOne({ _id: order._id }, { status: 'Pending' });
      throw e;
    }
  } else {
    await Order.updateOne({ _id: order._id, status: order.status }, { status });
  }
  notify([order.createdBy], { title: `Order ${status.toLowerCase()}`, message: `${order.orderNumber} is now ${status}.`, type: status === 'Cancelled' ? 'danger' : 'success', link: `/orders/${order._id}` }).catch(() => {});
  res.json(await populate(Order.findById(order._id)));
}));

router.put('/:id/cancel', protect, authorize('salesRepresentative', 'admin'), ah(async (req, res) => {
  const filter = { _id: req.params.id, status: 'Pending' };
  if (req.user.role === 'salesRepresentative') filter.createdBy = req.user._id;
  const order = await Order.findOneAndUpdate(filter, { status: 'Cancelled' }, { new: true });
  if (!order) {
    const exists = await Order.findOne(req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id });
    if (!exists) throw httpError(404, 'Order not found');
    throw httpError(400, 'Only orders that have not been processed can be cancelled');
  }
  notifyAdmins({ title: 'Order cancelled', message: `${order.orderNumber} was cancelled.`, type: 'danger', link: `/orders/${order._id}` }).catch(() => {});
  res.json(await populate(Order.findById(order._id)));
}));
module.exports = router;
