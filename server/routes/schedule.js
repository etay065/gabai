const router = require('express').Router();
const Schedule = require('../models/Schedule');
const Request = require('../models/Request');
const authMiddleware = require('../middleware/auth');

// GET /api/schedule?synagogueId=...
router.get('/', async (req, res) => {
  try {
    const { synagogueId } = req.query;
    if (!synagogueId) return res.status(400).json({ message: 'synagogueId נדרש' });
    const schedule = await Schedule.findOne({ synagogueId });
    res.json(schedule || { shabbat: [], weekday: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/schedule — gabai saves schedule
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { shabbat, weekday } = req.body;
    const schedule = await Schedule.findOneAndUpdate(
      { synagogueId: req.user.synagogueId },
      { shabbat, weekday },
      { upsert: true, new: true }
    );
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/schedule/availability?synagogueId=...&date=YYYY-MM-DD
router.get('/availability', async (req, res) => {
  try {
    const { synagogueId, date } = req.query;
    if (!synagogueId || !date) return res.status(400).json({ message: 'חסרים פרמטרים' });

    const d = new Date(date + 'T12:00:00');
    const isShabbat = d.getDay() === 6;

    const schedule = await Schedule.findOne({ synagogueId });
    const slots = schedule ? (isShabbat ? schedule.shabbat : schedule.weekday) : [];

    // Get approved requests for this date
    const requests = await Request.find({
      synagogueId,
      requestDate: date,
      status: { $in: ['approved', 'pending'] }
    });

    // Mark each slot as taken or free
    const availability = slots.map(slot => {
      const taken = requests.find(r => r.type === slot.type && r.sub === slot.sub);
      return {
        ...slot.toObject(),
        taken: !!taken,
        takenBy: taken ? taken.memberName : null,
      };
    });

    res.json({ slots: availability, isShabbat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
