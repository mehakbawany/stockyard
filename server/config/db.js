const mongoose = require('mongoose');
let cached;
module.exports = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!cached) cached = mongoose.connect("mongodb+srv://mehakbawany2009_db_user:mehakbawany2009@cluster1.wf9rkz6.mongodb.net/inventory_hackathon?retryWrites=true&w=majority"
).then(() => console.log('MongoDB connected'));
  try { await cached; } catch (e) { cached = null; throw e; }
};