const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  memberName: { type: String, required: true, trim: true },
  day: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun ... 6=Sat
  type: { type: String, enum: ['תפילה', 'קריאת תורה'], required: true },
  sub: { type: String, required: true }, // e.g. "שחרית" or "כהן (ראשון)"
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  shabbatLabel: { type: String, default: '' }, // e.g. "פרשת בהעלותך"
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
