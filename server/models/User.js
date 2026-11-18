const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'warehouseManager', 'supplier', 'salesRepresentative'], default: 'salesRepresentative' },
  assignedWarehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }],
  companyName: { type: String, default: '' },
  address: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  image: { type: String, default: '' },
  imageFileId: { type: String, default: '' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = function (plain) { return bcrypt.compare(plain, this.password); };
userSchema.set('toJSON', { transform: (doc, ret) => { delete ret.password; return ret; } });
module.exports = mongoose.model('User', userSchema);
