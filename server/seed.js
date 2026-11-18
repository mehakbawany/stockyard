// npm run seed  -> wipes the DB and inserts demo data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'), Product = require('./models/Product'), Warehouse = require('./models/Warehouse');
const Stock = require('./models/Stock'), Tx = require('./models/StockTransaction'), Order = require('./models/Order');
const SupplyRequest = require('./models/SupplyRequest'), Notification = require('./models/Notification');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Product, Warehouse, Stock, Tx, Order, SupplyRequest, Notification].map(M => M.deleteMany({})));

  const admin = await User.create({ name: 'Ayesha Admin', email: 'admin@ims.com', password: 'Admin@123', role: 'admin', phone: '0300-1111111' });
  const m1 = await User.create({ name: 'Bilal Manager', email: 'manager@ims.com', password: 'Manager@123', role: 'warehouseManager', phone: '0300-2222222' });
  const m2 = await User.create({ name: 'Hina Manager', email: 'manager2@ims.com', password: 'Manager@123', role: 'warehouseManager', phone: '0300-2222333' });
  const sup = await User.create({ name: 'Sami Supplier', email: 'supplier@ims.com', password: 'Supplier@123', role: 'supplier', companyName: 'TechSource Pvt Ltd', address: 'Korangi, Karachi', phone: '0300-3333333' });
  const sup2 = await User.create({ name: 'Nida Traders', email: 'supplier2@ims.com', password: 'Supplier@123', role: 'supplier', companyName: 'Nida Traders', phone: '0300-3333444' });
  const rep = await User.create({ name: 'Zain Sales', email: 'sales@ims.com', password: 'Sales@123', role: 'salesRepresentative', phone: '0300-4444444' });

  const [w1, w2, w3] = await Warehouse.insertMany([
    { name: 'Karachi Central', location: 'SITE Area, Karachi', capacity: 2000, manager: m1._id },
    { name: 'Lahore Hub', location: 'Sundar Industrial Estate, Lahore', capacity: 1500, manager: m2._id },
    { name: 'Islamabad Depot', location: 'I-9 Industrial Area, Islamabad', capacity: 800 }
  ]);
  await User.updateOne({ _id: m1._id }, { assignedWarehouses: [w1._id] });
  await User.updateOne({ _id: m2._id }, { assignedWarehouses: [w2._id] });

  const P = (name, sku, category, price, lowStockLimit, supplier, description) => ({ name, sku, category, price, lowStockLimit, supplier: supplier._id, createdBy: admin._id, description });
  const prods = await Product.insertMany([
    P('Mechanical Keyboard', 'KB-001', 'Peripherals', 1500, 10, sup, 'RGB mechanical keyboard, blue switches'),
    P('Wireless Mouse', 'MS-002', 'Peripherals', 800, 10, sup, '2.4GHz silent wireless mouse'),
    P('Laptop 15"', 'LP-003', 'Computers', 80000, 5, sup, '15.6 inch, 16GB RAM, 512GB SSD'),
    P('27" Monitor', 'MN-004', 'Displays', 32000, 4, sup2, 'IPS QHD monitor, 75Hz'),
    P('USB-C Hub', 'HB-005', 'Accessories', 2500, 15, sup2, '7-in-1 aluminium hub'),
    P('Webcam HD', 'WC-006', 'Peripherals', 4500, 8, sup, '1080p webcam with mic'),
    P('Laptop Stand', 'ST-007', 'Accessories', 3200, 6, sup2, 'Adjustable aluminium stand'),
    P('Headset Pro', 'HS-008', 'Audio', 6500, 8, sup, 'Noise cancelling USB headset')
  ]);
  const qty = [[60, 30, 0], [4, 25, 10], [20, 8, 5], [9, 3, 6], [45, 20, 0], [12, 0, 7], [18, 14, 4], [7, 22, 9]];
  const whs = [w1, w2, w3];
  const stocks = [], txs = [];
  prods.forEach((p, i) => whs.forEach((w, j) => {
    const q = qty[i][j]; if (!q) return;
    stocks.push({ product: p._id, warehouse: w._id, quantity: q });
    txs.push({ product: p._id, warehouse: w._id, transactionType: 'stock-in', quantity: q + 5, note: 'Initial stock', performedBy: j === 1 ? m2._id : m1._id, date: new Date(Date.now() - (i + j + 3) * 864e5) });
    txs.push({ product: p._id, warehouse: w._id, transactionType: 'stock-out', quantity: 5, note: 'Damaged / sample', performedBy: j === 1 ? m2._id : m1._id, date: new Date(Date.now() - (i + j + 1) * 864e5) });
  }));
  await Stock.insertMany(stocks); await Tx.insertMany(txs);

  // historical completed orders for the charts
  const orders = [];
  for (let m = 5; m >= 0; m--) for (let k = 0; k < 2 + (m % 3); k++) {
    const p = prods[(m + k) % 5], n = 1 + ((m + k) % 4);
    orders.push({ orderNumber: `ORD-HIST-${m}${k}`, customerName: ['Acme Corp', 'Delta Traders', 'Khan & Sons', 'Orbit IT'][(m + k) % 4], customerPhone: '0321-0000000', products: [{ product: p._id, quantity: n, price: p.price }], totalAmount: n * p.price, warehouse: w1._id, createdBy: rep._id, status: 'Completed', createdAt: new Date(Date.now() - (m * 30 + 3 + k * 4) * 864e5) });
  }
  orders.push({ orderNumber: 'ORD-DEMO-0001', customerName: 'Metro Electronics', customerPhone: '0333-1234567', products: [{ product: prods[0]._id, quantity: 2, price: 1500 }, { product: prods[1]._id, quantity: 3, price: 800 }], totalAmount: 5400, warehouse: w1._id, createdBy: rep._id, status: 'Pending' });
  await Order.collection.insertMany(orders.map(o => ({ ...o, updatedAt: o.createdAt || new Date(), createdAt: o.createdAt || new Date() })));

  await SupplyRequest.insertMany([
    { supplier: sup._id, product: prods[1]._id, warehouse: w1._id, quantity: 100, note: 'Mouse stock is running low, can ship in 2 days', status: 'Pending' },
    { supplier: sup._id, product: prods[0]._id, warehouse: w1._id, quantity: 50, status: 'Approved', reviewedBy: m1._id, reviewedAt: new Date() },
    { supplier: sup2._id, product: prods[3]._id, warehouse: w2._id, quantity: 20, status: 'Rejected', reviewNote: 'Overstocked this month', reviewedBy: m2._id, reviewedAt: new Date() }
  ]);
  await Notification.insertMany([
    { user: admin._id, title: 'Low stock alert', message: 'Wireless Mouse has 4 unit(s) left in Karachi Central (limit 10).', type: 'warning', link: '/low-stock', key: `low:${prods[1]._id}:${w1._id}` },
    { user: admin._id, title: 'Welcome to IMS', message: 'Press Ctrl+K anywhere to jump to any page.', type: 'info' }
  ]);
  console.log('Seeded. Logins: admin@ims.com / Admin@123, manager@ims.com / Manager@123, supplier@ims.com / Supplier@123, sales@ims.com / Sales@123');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
