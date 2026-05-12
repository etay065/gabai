const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  synagogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', required: true },
  username:    { type: String, required: true, trim: true },
  firstName:   { type: String, required: true, trim: true },
  lastName:    { type: String, required: true, trim: true },
  parentName:  { type: String, default: '', trim: true },
  tribe:       { type: String, enum: ['כהן', 'לוי', 'ישראל'], default: 'ישראל' },
  balance:     { type: Number, default: 0 },
  notes:       { type: String, default: '' },
}, { timestamps: true });

memberSchema.index({ synagogueId: 1, username: 1 }, { unique: true });

module.exports = mongoose.model('Member', memberSchema);
