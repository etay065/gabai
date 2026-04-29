const router = require('express').Router();
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/auth');

const DEFAULT_SCHEDULE = [
  { day: 0, prayers: [{ time: '6:30', name: 'שחרית', details: '' }, { time: '19:30', name: 'מנחה', details: '' }, { time: '20:00', name: 'מעריב', details: '' }] },
  { day: 1, prayers: [{ time: '6:30', name: 'שחרית', details: '' }, { time: '19:30', name: 'מנחה', details: '' }, { time: '20:00', name: 'מעריב', details: '' }] },
  { day: 2, prayers: [{ time: '6:30', name: 'שחרית', details: '' }, { time: '19:30', name: 'מנחה', details: '' }, { time: '20:00', name: 'מעריב', details: '' }] },
  { day: 3, prayers: [{ time: '6:30', name: 'שחרית', details: '' }, { time: '19:30', name: 'מנחה', details: '' }, { time: '20:00', name: 'מעריב', details: '' }] },
  { day: 4, prayers: [{ time: '6:30', name: 'שחרית', details: '' }, { time: '19:30', name: 'מנחה', details: '' }, { time: '20:00', name: 'מעריב', details: '' }] },
  { day: 5, prayers: [{ time: '7:00', name: 'שחרית', details: 'ערב שבת' }, { time: '19:45', name: 'קבלת שבת + מעריב', details: 'כניסת שבת 19:52' }] },
  { day: 6, prayers: [
    { time: '8:30', name: 'שחרית', details: '' },
    { time: '9:45', name: 'קריאת התורה', details: '' },
    { time: '10:30', name: 'מוסף', details: '' },
    { time: '17:30', name: 'שיעור', details: 'בין מנחה למעריב' },
    { time: '18:30', name: 'מנחה', details: '' },
    { time: '20:10', name: 'מעריב', details: 'יציאת שבת 20:16' },
  ]},
];

// GET /api/schedule  — all days
router.get('/', async (req, res) => {
  try {
    let schedules = await Schedule.find().sort({ day: 1 });
    if (schedules.length === 0) {
      schedules = await Schedule.insertMany(DEFAULT_SCHEDULE);
    }
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// GET /api/schedule/:day
router.get('/:day', async (req, res) => {
  try {
    const day = Number(req.params.day);
    let sched = await Schedule.findOne({ day });
    if (!sched) {
      const def = DEFAULT_SCHEDULE.find(d => d.day === day);
      if (!def) return res.status(404).json({ message: 'יום לא נמצא' });
      sched = await Schedule.create(def);
    }
    res.json(sched);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// PUT /api/schedule/:day  (protected)
router.put('/:day', authMiddleware, async (req, res) => {
  try {
    const day = Number(req.params.day);
    const { prayers } = req.body;
    const sched = await Schedule.findOneAndUpdate(
      { day },
      { prayers },
      { new: true, upsert: true }
    );
    res.json(sched);
  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
