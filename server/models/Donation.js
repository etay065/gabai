const mongoose = require('mongoose');
const donationSchema = new mongoose.Schema({
  synagogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', required: true },
  memberName:  { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String, default: '', trim: true },
  paid:        { type: Boolean, default: false },
  source:      { type: String, enum: ['gabai', 'member'], default: 'gabai' },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
