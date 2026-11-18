const router = require('express').Router();
const SupplyRequest = require('../models/SupplyRequest');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { protect, authorize, warehouseScope, assertWarehouseAccess } = require('../middleware/auth');
const { ah, httpError, positiveInt } = require('../utils/helpers');
const { notify, notifyAdmins } = require('../utils/notify');
const { stockIn } = require('../services/stock');
const populate = q => q.populate('product', 'name sku imageUrl').populate('warehouse', 'name').populate('supplier', 'name companyName image').populate('reviewedBy', 'name');

router.post('/', protect, authorize('supplier'), ah(async (req, res) => {
  const { product, warehouse, note } = req.body;
  const quantity = positiveInt(req.body.quantity);
  const p = await Product.findById(product);
  if (!p || String(p.supplier) !== String(req.user._id)) throw httpError(403, 'You can only supply your own products');
  const w = await Warehouse.findById(warehouse);
  if (!w) throw httpError(404, 'Warehouse not found');
  const r = await SupplyRequest.create({ supplier: req.user._id, product, warehouse, quantity, note });
  const payload = { title: 'New supply request', message: `${req.user.name} offers ${quantity} x ${p.name} for ${w.name}.`, type: 'info', link: '/supply-requests' };
  notifyAdmins(payload).catch(() => {}); notify([w.manager], payload).catch(() => {});
  res.status(201).json(await populate(SupplyRequest.findById(r._id)));
}));

router.get('/', protect, authorize('admin', 'warehouseManager', 'supplier'), ah(async (req, res) => {
  const q = {};
  if (req.user.role === 'supplier') q.supplier = req.user._id;
  if (req.user.role === 'warehouseManager') q.warehouse = { $in: await warehouseScope(req.user) };
  if (req.query.status) q.status = req.query.status;
  res.json(await populate(SupplyRequest.find(q).sort('-createdAt')));
}));

router.put('/:id/status', protect, authorize('admin', 'warehouseManager'), ah(async (req, res) => {
  const { status, reviewNote, receiveStock } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) throw httpError(400, 'Status must be Approved or Rejected');
  const r = await SupplyRequest.findById(req.params.id);
  if (!r) throw httpError(404, 'Request not found');
  await assertWarehouseAccess(req.user, r.warehouse);
  const locked = await SupplyRequest.findOneAndUpdate({ _id: r._id, status: 'Pending' }, { status, reviewNote, reviewedBy: req.user._id, reviewedAt: new Date() }, { new: true });
  if (!locked) throw httpError(400, 'This request has already been reviewed');
  if (status === 'Approved' && receiveStock) {
    try { await stockIn({ product: r.product, warehouse: r.warehouse, quantity: r.quantity, note: 'Supply request approved', user: req.user }); }
    catch (e) { await SupplyRequest.updateOne({ _id: r._id }, { status: 'Pending', reviewedBy: null }); throw e; }
  }
  notify([r.supplier], { title: `Supply request ${status.toLowerCase()}`, message: reviewNote || `Your request for ${r.quantity} units was ${status.toLowerCase()}.`, type: status === 'Approved' ? 'success' : 'danger', link: '/supply-requests' }).catch(() => {});
  res.json(await populate(SupplyRequest.findById(r._id)));
}));
module.exports = router;
