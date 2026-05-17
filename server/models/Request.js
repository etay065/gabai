const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  memberName:   { type: String, required: true, trim: true },
  synagogueId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', required: true },
  day:          { type: Number, required: true, min: 0, max: 6 },
  requestDate:  { type: String, default: '' },
  type:         { type: String, enum: ['תפילה', 'קריאת תורה', 'דרשן', 'תרגום'], required: true },
  sub:          { type: String, required: true },
  reason:       { type: String, default: '' },
  status:       { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  shabbatLabel: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
