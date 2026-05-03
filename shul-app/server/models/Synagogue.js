const mongoose = require('mongoose');

const synagogueSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  city:     { type: String, required: true, trim: true },
  parasha:  { type: String, default: '' },
  code:     { type: String, unique: true, trim: true }, // auto-generated short code
  gabaiId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Auto-generate a short unique code before save
synagogueSchema.pre('save', async function (next) {
  if (!this.code) {
    const base = this.name.replace(/\s+/g, '').slice(0, 6).toLowerCase();
    const rand = Math.random().toString(36).slice(2, 5);
    this.code = `${base}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Synagogue', synagogueSchema);
