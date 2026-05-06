const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  memberName: { type: String, required: true },
  amount:     { type: Number, required: true },
  createdAt:  { type: Date, default: Date.now },
}, { _id: false });

const auctionSchema = new mongoose.Schema({
  synagogueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Synagogue', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  startPrice:  { type: Number, default: 0 },
  currentPrice:{ type: Number, default: 0 },
  startTime:   { type: Date, required: true },
  endTime:     { type: Date, required: true },
  status:      { type: String, enum: ['pending', 'active', 'ended'], default: 'pending' },
  winner:      { type: String, default: '' },
  bids:        [bidSchema],
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);
