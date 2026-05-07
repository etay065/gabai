const router = require('express').Router();
const Request = require('../models/Request');
const authMiddleware = require('../middleware/auth');

// GET /api/requests
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
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/requests
router.post('/', async (req, res) => {
  try {
    const { memberName, synagogueId, day, type, sub, reason, shabbatLabel, requestDate, status } = req.body;
    if (!memberName || !synagogueId || day === undefined || !type || !sub)
      return res.status(400).json({ message: 'חסרים שדות חובה' });
    const request = await Request.create({ memberName, synagogueId, day, type, sub, reason, shabbatLabel, requestDate: requestDate || '', status: status || 'pending' });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PUT /api/requests/:id — gabai edits
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { memberName, day, type, sub, reason, shabbatLabel, requestDate, status } = req.body;
    const request = await Request.findByIdAndUpdate(req.params.id, { memberName, day, type, sub, reason, shabbatLabel, requestDate, status }, { new: true });
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PATCH /api/requests/:id/status — gabai only
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'declined'].includes(status))
      return res.status(400).json({ message: 'סטטוס לא חוקי' });

    const request = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// DELETE /api/requests/:id — gabai only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
