const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('StockTransaction', new mongoose.Schema({
  product: { type: ObjectId, ref: 'Product', required: true },
  warehouse: { type: ObjectId, ref: 'Warehouse', required: true },
  transactionType: { type: String, enum: ['stock-in', 'stock-out'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String, default: '' },
  performedBy: { type: ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
}));
