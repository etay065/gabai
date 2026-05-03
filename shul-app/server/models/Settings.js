const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shulName: { type: String, default: 'בית הכנסת הגדול' },
  city: { type: String, default: 'תל אביב' },
  parasha: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
