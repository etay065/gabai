const router = require('express').Router();
const Request = require('../models/Request');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.synagogueId) filter.synagogueId = req.query.synagogueId;
    if (req.query.memberName)  filter.memberName  = req.query.memberName;
    if (req.query.day !== undefined) filter.day   = Number(req.query.day);
    if (req.query.status)      filter.status      = req.query.status;

    const requests = await Request.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('GET /requests error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('POST /requests body:', req.body);
    const { memberName, synagogueId, day, type, sub, reason, shabbatLabel } = req.body;
    if (!memberName || !synagogueId || day === undefined || !type || !sub)
      return res.status(400).json({ message: 'חסרים שדות חובה', received: req.body });

    const request = await Request.create({ memberName, synagogueId, day, type, sub, reason, shabbatLabel });
    res.status(201).json(request);
  } catch (err) {
    console.error('POST /requests error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'declined'].includes(status))
      return res.status(400).json({ message: 'סטטוס לא חוקי' });

    const request = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    console.error('PATCH /requests error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
