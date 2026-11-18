const router = require('express').Router();
const Warehouse = require('../models/Warehouse');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { protect, authorize, warehouseScope } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');

async function syncManager(w, prevManager) {
  if (prevManager && String(prevManager) !== String(w.manager || ''))
    await User.updateOne({ _id: prevManager }, { $pull: { assignedWarehouses: w._id } });
  if (w.manager) {
    const m = await User.findById(w.manager);
    if (!m || m.role !== 'warehouseManager') throw httpError(400, 'Selected user is not a warehouse manager');
    await User.updateOne({ _id: w.manager }, { $addToSet: { assignedWarehouses: w._id } });
  }
}

router.get('/', protect, ah(async (req, res) => {
  const ids = await warehouseScope(req.user);
  const list = await Warehouse.find(ids ? { _id: { $in: ids } } : {}).populate('manager', 'name email image phone').sort('name').lean();
  const agg = await Stock.aggregate([{ $group: { _id: '$warehouse', used: { $sum: '$quantity' }, products: { $sum: { $cond: [{ $gt: ['$quantity', 0] }, 1, 0] } } } }]);
  const m = Object.fromEntries(agg.map(a => [String(a._id), a]));
  res.json(list.map(w => ({ ...w, used: m[String(w._id)]?.used || 0, productCount: m[String(w._id)]?.products || 0 })));
}));

router.post('/', protect, authorize('admin'), ah(async (req, res) => {
  const { name, location, capacity, manager } = req.body;
  const w = new Warehouse({ name, location, capacity, manager: manager || undefined });
  await syncManager(w); await w.save();
  res.status(201).json(w);
}));

router.put('/:id', protect, authorize('admin'), ah(async (req, res) => {
  const w = await Warehouse.findById(req.params.id);
  if (!w) throw httpError(404, 'Warehouse not found');
  const prev = w.manager;
  ['name', 'location', 'capacity'].forEach(f => { if (req.body[f] !== undefined) w[f] = req.body[f]; });
  if (req.body.manager !== undefined) w.manager = req.body.manager || undefined;
  await syncManager(w, prev); await w.save();
  res.json(w);
}));

router.delete('/:id', protect, authorize('admin'), ah(async (req, res) => {
  const has = await Stock.findOne({ warehouse: req.params.id, quantity: { $gt: 0 } });
  if (has) throw httpError(400, 'This warehouse still holds stock. Move or remove it first.');
  const w = await Warehouse.findByIdAndDelete(req.params.id);
  if (!w) throw httpError(404, 'Warehouse not found');
  await Stock.deleteMany({ warehouse: w._id });
  await User.updateMany({}, { $pull: { assignedWarehouses: w._id } });
  res.json({ message: 'Warehouse deleted' });
}));
module.exports = router;
