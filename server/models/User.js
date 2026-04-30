const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['gabai'], default: 'gabai' },
  synagogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);