const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const s = new mongoose.Schema({
  product: { type: ObjectId, ref: 'Product', required: true },
  warehouse: { type: ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
s.index({ product: 1, warehouse: 1 }, { unique: true }); // one Stock record per product per warehouse
module.exports = mongoose.model('Stock', s);
