const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const { ah, httpError } = require('../utils/helpers');

const protect = ah(async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw httpError(401, 'Please log in to continue');
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); } catch { throw httpError(401, 'Session expired, please log in again'); }
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw httpError(401, 'This account is unavailable');
  req.user = user; next();
});

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(httpError(403, 'Access denied: your role cannot perform this action'));

// Warehouses a manager may touch (null = unrestricted).
async function warehouseScope(user) {
  if (user.role !== 'warehouseManager') return null;
  const owned = await Warehouse.find({ manager: user._id }).select('_id');
  return [...new Set([...user.assignedWarehouses.map(String), ...owned.map(w => String(w._id))])];
}
async function assertWarehouseAccess(user, warehouseId) {
  if (user.role === 'admin') return;
  const ids = await warehouseScope(user);
  if (!ids || !ids.includes(String(warehouseId))) throw httpError(403, 'You are not assigned to this warehouse');
}
module.exports = { protect, authorize, warehouseScope, assertWarehouseAccess };
