const mongoose = require('mongoose');

const prayerSlotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  name: { type: String, required: true },
  details: { type: String, default: '' },
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  day: { type: Number, required: true, min: 0, max: 6, unique: true },
  prayers: [prayerSlotSchema],
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
