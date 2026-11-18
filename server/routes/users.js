const router = require('express').Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');
const { applyImage, removeFile } = require('../utils/image');

// light list for dropdowns (any logged-in user)
router.get('/suppliers', protect, ah(async (req, res) => {
  res.json(await User.find({ role: 'supplier', isActive: true }).select('name companyName image email phone').sort('name'));
}));

router.get('/', protect, authorize('admin'), ah(async (req, res) => {
  const { search, role } = req.query; const q = {};
  if (role) q.role = role;
  if (search) q.$or = ['name', 'email', 'phone'].map(f => ({ [f]: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }));
  res.json(await User.find(q).populate('assignedWarehouses', 'name').sort('-createdAt'));
}));

router.post('/', protect, authorize('admin'), ah(async (req, res) => {
  const { name, email, password, phone, role, assignedWarehouses, companyName } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'Email already in use');
  const user = new User({ name, email, password, phone, role, assignedWarehouses: assignedWarehouses || [], companyName });
  await applyImage(user, req.body, 'image', 'imageFileId');
  await user.save();
  res.status(201).json(user);
}));

router.put('/:id', protect, ah(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && String(req.user._id) !== req.params.id) throw httpError(403, 'You can only edit your own profile');
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  const b = req.body;
  ['name', 'phone', 'companyName', 'address'].forEach(f => { if (b[f] !== undefined) user[f] = b[f]; });
  if (isAdmin) {
    if (b.email) user.email = b.email;
    if (b.role) user.role = b.role;
    if (b.isActive !== undefined) {
      if (String(user._id) === String(req.user._id) && !b.isActive) throw httpError(400, 'You cannot deactivate yourself');
      user.isActive = b.isActive;
    }
    if (b.assignedWarehouses) user.assignedWarehouses = b.assignedWarehouses;
    if (b.password) user.password = b.password;
  }
  await applyImage(user, b, 'image', 'imageFileId');
  await user.save();
  res.json(await User.findById(user._id).populate('assignedWarehouses', 'name'));
}));

router.delete('/:id', protect, authorize('admin'), ah(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw httpError(400, 'You cannot delete your own account');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  await removeFile(user.imageFileId);
  res.json({ message: 'User deleted' });
}));
module.exports = router;
