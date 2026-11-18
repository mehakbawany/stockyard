require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*' }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ ok: true, name: 'Inventory & Warehouse API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/supply-requests', require('./routes/supplyRequests'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  let status = err.status || 500, message = err.message || 'Server error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err.name === 'CastError') { status = 400; message = 'Invalid id or value supplied'; }
  if (err.code === 11000) { status = 409; message = `Duplicate value for ${Object.keys(err.keyPattern || {}).join(', ')}`; }
  if (status === 500) console.error(err);
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`API running on :${PORT}`)));
