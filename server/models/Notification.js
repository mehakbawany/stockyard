const mongoose = require('mongoose');
module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: String, message: String, link: { type: String, default: '' }, key: { type: String, default: '', index: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
  read: { type: Boolean, default: false }
}, { timestamps: true }));
