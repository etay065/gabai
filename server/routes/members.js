const router = require('express').Router();
const Member = require('../models/Member');
const authMiddleware = require('../middleware/auth');

// GET /api/members?synagogueId=...
router.get('/', async (req, res) => {
  try {
    const { synagogueId } = req.query;
    if (!synagogueId) return res.status(400).json({ message: 'synagogueId נדרש' });
    const members = await Member.find({ synagogueId }).sort({ lastName: 1, firstName: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/login — member login by username + synagogueId
router.get('/login', async (req, res) => {
  try {
    const { username, synagogueId } = req.query;
    if (!username || !synagogueId) return res.status(400).json({ message: 'חסרים שדות' });
    const member = await Member.findOne({ username, synagogueId });
    if (!member) return res.status(404).json({ message: 'משתמש לא נמצא' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/members — gabai creates member
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username, firstName, lastName, parentName, tribe } = req.body;
    if (!username || !firstName || !lastName)
      return res.status(400).json({ message: 'חסרים שדות חובה' });
    const member = await Member.create({
      synagogueId: req.user.synagogueId,
      username, firstName, lastName,
      parentName: parentName || '',
      tribe: tribe || 'ישראל',
    });
    res.status(201).json(member);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'שם המשתמש כבר קיים' });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/members/:id — gabai edits
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { username, firstName, lastName, parentName, tribe, notes } = req.body;
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { username, firstName, lastName, parentName, tribe, notes },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: 'לא נמצא' });
    res.json(member);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'שם המשתמש כבר קיים' });
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/members/:id/balance — gabai updates balance
router.patch('/:id/balance', authMiddleware, async (req, res) => {
  try {
    const { amount, action } = req.body;
    let update = {};
    if (action === 'reset') update = { balance: 0 };
    else if (action === 'paid') update = { balance: 0 };
    else update = { $inc: { balance: Number(amount) } };
    const member = await Member.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
