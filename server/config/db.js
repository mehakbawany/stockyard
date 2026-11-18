const mongoose = require('mongoose');
module.exports = async () => {
  try { await mongoose.connect("mongodb+srv://mehakbawany2009_db_user:mehakbawany2009@cluster1.wf9rkz6.mongodb.net/inventory_hackathon?retryWrites=true&w=majority"), console.log('MongoDB connected'); }
  catch (e) { console.error('MongoDB connection failed:', e.message); process.exit(1); }
};
