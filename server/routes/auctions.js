const router = require('express').Router();
const Auction = require('../models/Auction');
const authMiddleware = require('../middleware/auth');

// עדכון סטטוס אוטומטי
async function updateStatuses() {
  const now = new Date();
  await Auction.updateMany(
    { status: 'pending', startTime: { $lte: now } },
    { status: 'active' }
  );
  const ended = await Auction.find({ status: 'active', endTime: { $lte: now } });
  for (const a of ended) {
    const winner = a.bids.length > 0
      ? a.bids.reduce((max, b) => b.amount > max.amount ? b : max, a.bids[0]).memberName
      : '';
    a.status = 'ended';
    a.winner = winner;
    await a.save();
  }
}

// GET /api/auctions?synagogueId=...
router.get('/', async (req, res) => {
  try {
    await updateStatuses();
    const { synagogueId, status } = req.query;
    const filter = {};
    if (synagogueId) filter.synagogueId = synagogueId;
    if (status) filter.status = status;
    const auctions = await Auction.find(filter).sort({ endTime: 1 });
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auctions/:id
router.get('/:id', async (req, res) => {
  try {
    await updateStatuses();
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'לא נמצא' });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auctions — gabai creates auction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, startPrice, startTime, endTime } = req.body;
    if (!title || !startTime || !endTime)
      return res.status(400).json({ message: 'חסרים שדות חובה' });

    const auction = await Auction.create({
      synagogueId: req.user.synagogueId,
      title, description,
      startPrice: startPrice || 0,
      currentPrice: startPrice || 0,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auctions/:id/bid — member places bid
router.post('/:id/bid', async (req, res) => {
  try {
    await updateStatuses();
    const { memberName, amount } = req.body;
    if (!memberName || !amount)
      return res.status(400).json({ message: 'חסרים שדות' });

    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'לא נמצא' });
    if (auction.status !== 'active')
      return res.status(400).json({ message: 'ההתמחרות לא פעילה' });
    if (amount <= auction.currentPrice)
      return res.status(400).json({ message: `יש להציע יותר מ-₪${auction.currentPrice}` });

    auction.bids.push({ memberName, amount });
    auction.currentPrice = amount;
    await auction.save();
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auctions/:id — gabai deletes
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Auction.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
