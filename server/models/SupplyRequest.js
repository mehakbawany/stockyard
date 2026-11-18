const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('SupplyRequest', new mongoose.Schema({
  supplier: { type: ObjectId, ref: 'User', required: true },
  product: { type: ObjectId, ref: 'Product', required: true },
  warehouse: { type: ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewNote: { type: String, default: '' },
  reviewedAt: Date
}, { timestamps: true }));
