const router = require('express').Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { ah } = require('../utils/helpers');
const { warehouseScope } = require('../middleware/auth');
const { syncLowStockNotifications } = require('../services/stock');
router.use(protect);
router.get('/', ah(async (req, res) => {
  if (['admin', 'warehouseManager'].includes(req.user.role)) await syncLowStockNotifications(req.user._id, await warehouseScope(req.user));
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(30),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);
  res.json({ items, unread });
}));
router.put('/read-all', ah(async (req, res) => { await Notification.updateMany({ user: req.user._id, read: false }, { read: true }); res.json({ ok: true }); }));
router.put('/:id/read', ah(async (req, res) => { await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true }); res.json({ ok: true }); }));
router.delete('/', ah(async (req, res) => { await Notification.deleteMany({ user: req.user._id }); res.json({ ok: true }); }));
module.exports = router;
