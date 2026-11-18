const Notification = require('../models/Notification');
const User = require('../models/User');
async function notify(userIds, { title, message, type = 'info', link = '', key = '' }) {
  const ids = [...new Set((userIds || []).filter(Boolean).map(String))];
  if (!ids.length) return;
  // a keyed alert (e.g. low stock for one product+warehouse) replaces its older copy instead of piling up
  if (key) await Notification.deleteMany({ user: { $in: ids }, key });
  await Notification.insertMany(ids.map(user => ({ user, title, message, type, link, key })));
}
async function notifyAdmins(payload) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  await notify(admins.map(a => a._id), payload);
}
module.exports = { notify, notifyAdmins };
