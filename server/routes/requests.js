const router = require('express').Router();
const Request = require('../models/Request');
const authMiddleware = require('../middleware/auth');

// GET /api/requests  — gabai: all; member: filter by memberName query param
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.memberName) filter.memberName = req.query.memberName;
    if (req.query.day !== undefined) filter.day = Number(req.query.day);
    if (req.query.status) filter.status = req.query.status;

    const requests = await Request.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/requests/stats  (protected — gabai only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [total, pending, approved, declined] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'approved' }),
      Request.countDocuments({ status: 'declined' }),
    ]);
    res.json({ total, pending, approved, declined });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// POST /api/requests  — anyone (member submits request)
router.post('/', async (req, res) => {
  try {
    const { memberName, day, type, sub, reason, shabbatLabel } = req.body;
    if (!memberName || day === undefined || !type || !sub)
      return res.status(400).json({ message: 'חסרים שדות חובה' });

    const request = await Request.create({ memberName, day, type, sub, reason, shabbatLabel });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PATCH /api/requests/:id/status  (protected — gabai only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'declined'].includes(status))
      return res.status(400).json({ message: 'סטטוס לא חוקי' });

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// DELETE /api/requests/:id  (protected — gabai only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
