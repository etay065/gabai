const router = require('express').Router();
const Donation = require('../models/Donation');
const authMiddleware = require('../middleware/auth');

// GET /api/donations?synagogueId=...
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { synagogueId } = req.query;
    if (!synagogueId) return res.status(400).json({ message: 'חסר synagogueId' });
    const donations = await Donation.find({ synagogueId }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/donations — גבאי או מתפלל
router.post('/', async (req, res) => {
  try {
    const { synagogueId, memberName, amount, description, source } = req.body;
    if (!synagogueId || !memberName || amount === undefined)
      return res.status(400).json({ message: 'חסרים שדות חובה' });
    const donation = await Donation.create({ synagogueId, memberName, amount, description, source: source || 'gabai' });
    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PATCH /api/donations/:id/paid — גבאי מסמן שולם
router.patch('/:id/paid', authMiddleware, async (req, res) => {
  try {
    const { paid } = req.body;
    const donation = await Donation.findByIdAndUpdate(req.params.id, { paid }, { new: true });
    if (!donation) return res.status(404).json({ message: 'תרומה לא נמצאה' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// DELETE /api/donations/:id — גבאי בלבד
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
