const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('Order', new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, default: '' },
  products: [{ product: { type: ObjectId, ref: 'Product' }, quantity: Number, price: Number }],
  totalAmount: { type: Number, default: 0 },
  warehouse: { type: ObjectId, ref: 'Warehouse', required: true },
  createdBy: { type: ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true }));
