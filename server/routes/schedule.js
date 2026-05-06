const router = require('express').Router();
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/auth');

const defaultPrayers = (day) => {
  const week = [
    [{ time:'6:30',name:'שחרית',details:''},{time:'19:30',name:'מנחה',details:''},{time:'20:00',name:'מעריב',details:''}],
    [{ time:'6:30',name:'שחרית',details:''},{time:'19:30',name:'מנחה',details:''},{time:'20:00',name:'מעריב',details:''}],
    [{ time:'6:30',name:'שחרית',details:''},{time:'19:30',name:'מנחה',details:''},{time:'20:00',name:'מעריב',details:''}],
    [{ time:'6:30',name:'שחרית',details:''},{time:'19:30',name:'מנחה',details:''},{time:'20:00',name:'מעריב',details:''}],
    [{ time:'6:30',name:'שחרית',details:''},{time:'19:30',name:'מנחה',details:''},{time:'20:00',name:'מעריב',details:''}],
    [{ time:'7:00',name:'שחרית',details:'ערב שבת'},{time:'19:45',name:'קבלת שבת + מעריב',details:''}],
    [{ time:'8:30',name:'שחרית',details:''},{time:'9:45',name:'קריאת התורה',details:''},{time:'10:30',name:'מוסף',details:''},{time:'17:30',name:'שיעור',details:'בין מנחה למעריב'},{time:'18:30',name:'מנחה',details:''},{time:'20:10',name:'מעריב',details:''}],
  ];
  return week[day] || [];
};

// GET /api/schedule?synagogueId=...
router.get('/', async (req, res) => {
  try {
    const { synagogueId } = req.query;
    if (!synagogueId) return res.status(400).json({ message: 'synagogueId נדרש' });

    let schedules = await Schedule.find({ synagogueId }).sort({ day: 1 });
    if (schedules.length === 0) {
      schedules = await Promise.all(
        [0,1,2,3,4,5,6].map(day =>
          Schedule.create({ synagogueId, day, prayers: defaultPrayers(day) })
        )
      );
    }
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PUT /api/schedule/:day?synagogueId=... (protected)
router.put('/:day', authMiddleware, async (req, res) => {
  try {
    const day = Number(req.params.day);
    const synagogueId = req.user.synagogueId;
    const { prayers } = req.body;
    const sched = await Schedule.findOneAndUpdate(
      { synagogueId, day },
      { prayers },
      { new: true, upsert: true }
    );
    res.json(sched);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
