const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { ah, httpError } = require('../utils/helpers');
const { notifyAdmins } = require('../utils/notify');

const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
const PUBLIC_ROLES = ['warehouseManager', 'supplier', 'salesRepresentative'];

router.post('/register', ah(async (req, res) => {
  const { name, email, password, phone, role, companyName } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  const r = role || 'salesRepresentative';
  if (!PUBLIC_ROLES.includes(r)) throw httpError(403, 'This role cannot be chosen at registration');
  if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password, phone, role: r, companyName: r === 'supplier' ? companyName : '' });
  notifyAdmins({ title: 'New user registered', message: `${user.name} joined as ${r}.`, type: 'info', link: '/users' }).catch(() => {});
  res.status(201).json({ token: sign(user), user });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Invalid email or password');
  if (!user.isActive) throw httpError(403, 'This account has been deactivated');
  res.json({ token: sign(user), user: await User.findById(user._id).populate('assignedWarehouses', 'name location') });
}));

router.get('/me', protect, ah(async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedWarehouses', 'name location');
  res.json(user);
}));

router.put('/password', protect, ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) throw httpError(400, 'New password must be at least 6 characters');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) throw httpError(400, 'Current password is incorrect');
  user.password = newPassword; await user.save();
  res.json({ message: 'Password updated' });
}));
module.exports = router;
