const mongoose = require('mongoose');

const prayerSlotSchema = new mongoose.Schema({
  time:    { type: String, required: true },
  name:    { type: String, required: true },
  details: { type: String, default: '' },
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  synagogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', required: true },
  day:         { type: Number, required: true, min: 0, max: 6 },
  prayers:     [prayerSlotSchema],
}, { timestamps: true });

scheduleSchema.index({ synagogueId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
