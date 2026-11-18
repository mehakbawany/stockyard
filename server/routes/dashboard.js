const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const StockTransaction = require('../models/StockTransaction');
const SupplyRequest = require('../models/SupplyRequest');
const { protect, warehouseScope } = require('../middleware/auth');
const { ah } = require('../utils/helpers');
const { getLowStock } = require('../services/stock');

const monthsAgo = n => { const d = new Date(); d.setMonth(d.getMonth() - n + 1, 1); d.setHours(0, 0, 0, 0); return d; };
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n + 1); d.setHours(0, 0, 0, 0); return d; };
const countBy = async (Model, match, field = 'status') =>
  Object.fromEntries((await Model.aggregate([{ $match: match }, { $group: { _id: '$' + field, n: { $sum: 1 } } }])).map(x => [x._id, x.n]));

router.get('/', protect, ah(async (req, res) => {
  const role = req.user.role, uid = req.user._id;

  if (role === 'admin') {
    const [users, products, warehouses, suppliers, orders, low, ordersByStatus, salesByMonth, top, byWh, recentOrders, pendingSupply] = await Promise.all([
      User.countDocuments(), Product.countDocuments(), Warehouse.countDocuments(), User.countDocuments({ role: 'supplier' }), Order.countDocuments(),
      getLowStock(null), countBy(Order, {}),
      Order.aggregate([{ $match: { createdAt: { $gte: monthsAgo(6) }, status: { $in: ['Processing', 'Completed'] } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $unwind: '$products' }, { $group: { _id: '$products.product', units: { $sum: '$products.quantity' } } }, { $sort: { units: -1 } }, { $limit: 5 }, { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } }, { $unwind: '$p' }, { $project: { name: '$p.name', units: 1 } }]),
      Stock.aggregate([{ $group: { _id: '$warehouse', units: { $sum: '$quantity' } } }, { $lookup: { from: 'warehouses', localField: '_id', foreignField: '_id', as: 'w' } }, { $unwind: '$w' }, { $project: { name: '$w.name', units: 1 } }]),
      Order.find().sort('-createdAt').limit(5).populate('createdBy', 'name'),
      SupplyRequest.countDocuments({ status: 'Pending' })
    ]);
    return res.json({ role, stats: { users, products, warehouses, suppliers, orders, lowStock: low.length, pendingSupply }, ordersByStatus, salesByMonth, topProducts: top, stockByWarehouse: byWh, recentOrders, lowPreview: low.slice(0, 4) });
  }

  if (role === 'warehouseManager') {
    const ids = await warehouseScope(req.user);
    const [warehouses, units, low, movement, recent, pendingOrders, pendingSupply] = await Promise.all([
      Warehouse.find({ _id: { $in: ids } }).lean(),
      Stock.aggregate([{ $match: { warehouse: { $in: (await Warehouse.find({ _id: { $in: ids } }).select('_id')).map(w => w._id) } } }, { $group: { _id: '$warehouse', units: { $sum: '$quantity' } } }]),
      getLowStock(ids),
      StockTransaction.aggregate([{ $match: { date: { $gte: daysAgo(7) }, warehouse: { $in: (await Warehouse.find({ _id: { $in: ids } }).select('_id')).map(w => w._id) } } }, { $group: { _id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, t: '$transactionType' }, qty: { $sum: '$quantity' } } }]),
      StockTransaction.find({ warehouse: { $in: ids } }).sort('-date').limit(6).populate('product', 'name').populate('warehouse', 'name'),
      Order.countDocuments({ warehouse: { $in: ids }, status: 'Pending' }),
      SupplyRequest.countDocuments({ warehouse: { $in: ids }, status: 'Pending' })
    ]);
    const um = Object.fromEntries(units.map(u => [String(u._id), u.units]));
    return res.json({ role, stats: { warehouses: warehouses.length, totalUnits: units.reduce((s, u) => s + u.units, 0), lowStock: low.length, pendingOrders, pendingSupply }, warehouses: warehouses.map(w => ({ ...w, used: um[String(w._id)] || 0 })), movement, recent, lowPreview: low.slice(0, 4) });
  }

  if (role === 'supplier') {
    const [products, byStatus, recent] = await Promise.all([
      Product.countDocuments({ supplier: uid }), countBy(SupplyRequest, { supplier: uid }),
      SupplyRequest.find({ supplier: uid }).sort('-createdAt').limit(5).populate('product', 'name').populate('warehouse', 'name')
    ]);
    return res.json({ role, stats: { products, total: Object.values(byStatus).reduce((a, b) => a + b, 0), pending: byStatus.Pending || 0, approved: byStatus.Approved || 0 }, requestsByStatus: byStatus, recent });
  }

  const [byStatus, recent, revenue, available] = await Promise.all([
    countBy(Order, { createdBy: uid }), Order.find({ createdBy: uid }).sort('-createdAt').limit(5).populate('warehouse', 'name'),
    Order.aggregate([{ $match: { createdBy: uid, status: { $in: ['Processing', 'Completed'] } } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    Stock.distinct('product', { quantity: { $gt: 0 } })
  ]);
  res.json({ role, stats: { orders: Object.values(byStatus).reduce((a, b) => a + b, 0), pending: byStatus.Pending || 0, completed: byStatus.Completed || 0, revenue: revenue[0]?.t || 0, available: available.length }, ordersByStatus: byStatus, recent });
}));
module.exports = router;
