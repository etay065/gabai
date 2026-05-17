const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ['תפילה','קריאת תורה','דרשן','תרגום'] },
  sub: String,
  time: String,
  label: String,
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  synagogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', required: true, unique: true },
  shabbat: { type: [slotSchema], default: [] },
  weekday: { type: [slotSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
