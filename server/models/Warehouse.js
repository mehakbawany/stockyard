const mongoose = require('mongoose');
module.exports = mongoose.model('Warehouse', new mongoose.Schema({
  name: { type: String, required: [true, 'Warehouse name is required'], trim: true },
  location: { type: String, required: [true, 'Location is required'], trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  capacity: { type: Number, default: 0, min: 0 }
}, { timestamps: true }));
