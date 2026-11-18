const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('Product', new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  description: { type: String, default: '' },
  sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
  category: { type: String, required: [true, 'Category is required'], trim: true },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  lowStockLimit: { type: Number, default: 10, min: 0 },
  imageUrl: { type: String, default: '' },
  imageFileId: { type: String, default: '' },
  supplier: { type: ObjectId, ref: 'User' },
  createdBy: { type: ObjectId, ref: 'User' }
}, { timestamps: true }));
